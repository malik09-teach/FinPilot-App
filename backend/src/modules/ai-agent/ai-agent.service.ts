import { prisma } from '../../config/prisma.js';
import { TransfersService } from '../transfers/transfers.service.js';
import { AuthService } from '../auth/auth.service.js';
import { AuditService } from '../audit/audit.service.js';

export class AiAgentService {
  static async getSessions(userId: string) {
    return prisma.agentSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  static async getSessionDetails(userId: string, sessionId: string) {
    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        actions: {
          orderBy: { createdAt: 'desc' },
          include: { approvals: true },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new Error('Session not found');
    }

    return session;
  }

  static async getPendingActions(userId: string) {
    return prisma.agentAction.findMany({
      where: {
        userId,
        status: 'AWAITING_APPROVAL',
      },
      orderBy: { createdAt: 'desc' },
      include: { approvals: true },
    });
  }

  static async approveAction(params: {
    userId: string;
    actionId: string;
    pin?: string;
  }) {
    const { userId, actionId, pin } = params;

    const action = await prisma.agentAction.findUnique({
      where: { id: actionId },
      include: { approvals: true },
    });

    if (!action || action.userId !== userId) {
      throw new Error('Action not found');
    }

    if (action.status !== 'AWAITING_APPROVAL') {
      throw new Error(`Action is in status ${action.status}, not AWAITING_APPROVAL.`);
    }

    // If action requires PIN (such as TRANSFER or FREEZE_CARD), verify PIN
    if (action.actionType === 'TRANSFER' || action.actionType === 'FREEZE_CARD') {
      if (!pin) {
        throw new Error('PIN is required to approve this sensitive transaction');
      }
      const isPinValid = await AuthService.verifyPin(userId, pin);
      if (!isPinValid) {
        throw new Error('Incorrect authorization PIN');
      }
    }

    // Update status to APPROVED then EXECUTING
    await prisma.agentAction.update({
      where: { id: action.id },
      data: { status: 'EXECUTING' },
    });

    const approval = action.approvals[0];
    if (approval) {
      await prisma.agentApproval.update({
        where: { id: approval.id },
        data: {
          status: 'APPROVED',
          respondedAt: new Date(),
          approvalMethod: pin ? 'PIN' : 'MANUAL',
        },
      });
    }

    const payload = JSON.parse(action.payload);
    let executionResult: any = null;

    try {
      if (action.actionType === 'TRANSFER') {
        executionResult = await TransfersService.executeTransfer({
          userId,
          recipientName: payload.recipientName,
          recipientAccount: payload.recipientAccount,
          recipientBank: payload.recipientBank || 'FinPilot',
          amount: payload.amount,
          note: payload.note || 'Transfer via AI Copilot',
          approvalId: approval?.id,
          idempotencyKey: `AGENT-EXEC-${action.id}`,
        });
      } else if (action.actionType === 'CREATE_SAVING_GOAL') {
        const goal = await prisma.savingGoal.create({
          data: {
            userId,
            name: payload.name,
            targetAmount: payload.targetAmount,
            deadline: payload.deadline ? new Date(payload.deadline) : undefined,
            category: 'AI_RECOMMENDED',
            status: 'ACTIVE',
          },
        });
        executionResult = { goal, message: 'Savings goal successfully activated.' };
      } else if (action.actionType === 'CREATE_BUDGET') {
        const budget = await prisma.budget.create({
          data: {
            userId,
            month: payload.month,
            totalLimit: payload.totalLimit,
            categories: {
              create: payload.categories.map((c: any) => ({
                category: c.category,
                allocatedAmount: c.allocatedAmount,
                spentAmount: 0,
              })),
            },
          },
          include: { categories: true },
        });
        executionResult = { budget, message: 'Budget plan successfully active.' };
      } else if (action.actionType === 'FREEZE_CARD') {
        const card = await prisma.card.findFirst({ where: { userId } });
        if (card) {
          const updated = await prisma.card.update({
            where: { id: card.id },
            data: { isFrozen: true },
          });
          executionResult = { card: updated, message: 'Card successfully frozen.' };
        }
      }

      // Mark COMPLETED
      const completedAction = await prisma.agentAction.update({
        where: { id: action.id },
        data: {
          status: 'COMPLETED',
          result: JSON.stringify(executionResult),
        },
      });

      // Post confirmation assistant message to session
      await prisma.agentMessage.create({
        data: {
          sessionId: action.sessionId,
          role: 'ASSISTANT',
          content: `✅ Action verified & completed! ${action.actionType.replace(/_/g, ' ')} has been executed safely through the banking core.`,
          metadata: JSON.stringify({
            actionId: action.id,
            status: 'COMPLETED',
            result: executionResult,
          }),
        },
      });

      await AuditService.log({
        userId,
        actorType: 'USER',
        action: 'AGENT_ACTION_APPROVED_AND_EXECUTED',
        entityType: 'AGENT_ACTION',
        entityId: action.id,
        details: { actionType: action.actionType, executionResult },
      });

      return {
        action: completedAction,
        executionResult,
      };
    } catch (err: any) {
      await prisma.agentAction.update({
        where: { id: action.id },
        data: {
          status: 'FAILED',
          result: JSON.stringify({ error: err.message }),
        },
      });
      throw err;
    }
  }

  static async rejectAction(userId: string, actionId: string, reason?: string) {
    const action = await prisma.agentAction.findUnique({
      where: { id: actionId },
      include: { approvals: true },
    });

    if (!action || action.userId !== userId) {
      throw new Error('Action not found');
    }

    const updated = await prisma.agentAction.update({
      where: { id: action.id },
      data: { status: 'REJECTED' },
    });

    const approval = action.approvals[0];
    if (approval) {
      await prisma.agentApproval.update({
        where: { id: approval.id },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
          remarks: reason || 'Declined by user',
        },
      });
    }

    await prisma.agentMessage.create({
      data: {
        sessionId: action.sessionId,
        role: 'ASSISTANT',
        content: `❌ The proposed ${action.actionType.replace(/_/g, ' ')} action was cancelled. No changes have been made to your account.`,
      },
    });

    await AuditService.log({
      userId,
      actorType: 'USER',
      action: 'AGENT_ACTION_REJECTED',
      entityType: 'AGENT_ACTION',
      entityId: action.id,
      details: { reason },
    });

    return updated;
  }
}
