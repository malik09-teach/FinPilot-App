import { prisma } from '../../config/prisma.js';
import { AccountsService } from '../../modules/accounts/accounts.service.js';
import { TransactionsService } from '../../modules/transactions/transactions.service.js';
import { TransfersService } from '../../modules/transfers/transfers.service.js';
import { AuditService } from '../../modules/audit/audit.service.js';

export interface ToolDefinition {
  name: string;
  type: 'READ' | 'DRAFT' | 'RESTRICTED';
  description: string;
  parameters: Record<string, unknown>;
  requiresApproval: boolean;
  execute: (userId: string, args: any) => Promise<any>;
}

export const toolRegistry: Record<string, ToolDefinition> = {
  // --- READ TOOLS ---
  get_account_balance: {
    name: 'get_account_balance',
    type: 'READ',
    description: 'Retrieve the current and available balance for user accounts',
    parameters: { type: 'object', properties: {} },
    requiresApproval: false,
    execute: async (userId: string) => {
      return await AccountsService.getBalance(userId);
    },
  },

  get_transactions: {
    name: 'get_transactions',
    type: 'READ',
    description: 'Retrieve recent or filtered transactions history',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        limit: { type: 'number' },
      },
    },
    requiresApproval: false,
    execute: async (userId: string, args?: { category?: string; limit?: number }) => {
      return await TransactionsService.getTransactions(userId, {
        category: args?.category,
        limit: args?.limit || 10,
      });
    },
  },

  get_spending_analytics: {
    name: 'get_spending_analytics',
    type: 'READ',
    description: 'Retrieve aggregated financial analysis, income vs expenses, and spending breakdown',
    parameters: { type: 'object', properties: {} },
    requiresApproval: false,
    execute: async (userId: string) => {
      return await TransactionsService.getAnalytics(userId);
    },
  },

  get_income_summary: {
    name: 'get_income_summary',
    type: 'READ',
    description: 'Retrieve income transactions and monthly average earnings',
    parameters: { type: 'object', properties: {} },
    requiresApproval: false,
    execute: async (userId: string) => {
      const credits = await prisma.transaction.findMany({
        where: { userId, type: 'CREDIT' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      const total = credits.reduce((sum, c) => sum + c.amount, 0);
      return { totalIncome: total, recentCredits: credits };
    },
  },

  get_expense_summary: {
    name: 'get_expense_summary',
    type: 'READ',
    description: 'Retrieve expense transactions grouped by category',
    parameters: { type: 'object', properties: {} },
    requiresApproval: false,
    execute: async (userId: string) => {
      const debits = await prisma.transaction.findMany({
        where: { userId, type: 'DEBIT' },
        orderBy: { createdAt: 'desc' },
      });
      const total = debits.reduce((sum, d) => sum + d.amount, 0);
      const categoryMap: Record<string, number> = {};
      debits.forEach((d) => {
        categoryMap[d.category] = (categoryMap[d.category] || 0) + d.amount;
      });
      return { totalExpense: total, categoryBreakdown: categoryMap };
    },
  },

  get_budget_progress: {
    name: 'get_budget_progress',
    type: 'READ',
    description: 'Retrieve current active budget, total limit, spending progress, and categories',
    parameters: { type: 'object', properties: {} },
    requiresApproval: false,
    execute: async (userId: string) => {
      const budget = await prisma.budget.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { categories: true },
      });
      return budget;
    },
  },

  get_savings_goals: {
    name: 'get_savings_goals',
    type: 'READ',
    description: 'Retrieve active savings goals, target amounts, current saved progress, and deadlines',
    parameters: { type: 'object', properties: {} },
    requiresApproval: false,
    execute: async (userId: string) => {
      return await prisma.savingGoal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  get_recurring_transactions: {
    name: 'get_recurring_transactions',
    type: 'READ',
    description: 'Retrieve recurring monthly and weekly subscriptions and automated bills',
    parameters: { type: 'object', properties: {} },
    requiresApproval: false,
    execute: async (userId: string) => {
      const items = await prisma.recurringTransaction.findMany({
        where: { userId },
        orderBy: { nextDate: 'asc' },
      });
      const totalMonthly = items.reduce((sum, item) => sum + item.expectedAmount, 0);
      return { subscriptions: items, totalMonthlyCost: totalMonthly };
    },
  },

  get_beneficiaries: {
    name: 'get_beneficiaries',
    type: 'READ',
    description: 'Retrieve saved payees, colleagues, and favorite transfer recipients',
    parameters: { type: 'object', properties: {} },
    requiresApproval: false,
    execute: async (userId: string) => {
      return await prisma.beneficiary.findMany({
        where: { userId },
        orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
      });
    },
  },

  // --- DRAFT TOOLS (Creates proposals requiring user confirmation) ---
  create_budget_draft: {
    name: 'create_budget_draft',
    type: 'DRAFT',
    description: 'Draft a recommended budget plan with category limits',
    parameters: {
      type: 'object',
      properties: {
        totalLimit: { type: 'number' },
        categories: { type: 'array' },
      },
    },
    requiresApproval: true,
    execute: async (userId: string, args: { totalLimit: number; categories: Array<{ category: string; allocatedAmount: number }> }) => {
      return {
        draftType: 'BUDGET_PLAN',
        proposedTotalLimit: args.totalLimit,
        proposedCategories: args.categories,
        summary: `Personalized monthly budget with PKR ${args.totalLimit.toLocaleString()} ceiling.`,
      };
    },
  },

  create_savings_goal_draft: {
    name: 'create_savings_goal_draft',
    type: 'DRAFT',
    description: 'Draft a structured savings plan goal with target amount, timeframe, and suggested monthly deposit',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        targetAmount: { type: 'number' },
        durationMonths: { type: 'number' },
        monthlyContribution: { type: 'number' },
      },
    },
    requiresApproval: true,
    execute: async (userId: string, args: { name: string; targetAmount: number; durationMonths: number; monthlyContribution?: number }) => {
      const monthly = args.monthlyContribution || Math.ceil(args.targetAmount / Math.max(1, args.durationMonths));
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + args.durationMonths);

      return {
        draftType: 'SAVINGS_GOAL',
        name: args.name,
        targetAmount: args.targetAmount,
        durationMonths: args.durationMonths,
        deadline: targetDate.toISOString(),
        suggestedMonthlyContribution: monthly,
        summary: `Goal to save PKR ${args.targetAmount.toLocaleString()} in ${args.durationMonths} months (PKR ${monthly.toLocaleString()}/month).`,
      };
    },
  },

  create_transfer_draft: {
    name: 'create_transfer_draft',
    type: 'DRAFT',
    description: 'Draft a money transfer after validating limits, recipient, and balance',
    parameters: {
      type: 'object',
      properties: {
        recipientName: { type: 'string' },
        recipientAccount: { type: 'string' },
        amount: { type: 'number' },
        note: { type: 'string' },
      },
    },
    requiresApproval: true,
    execute: async (userId: string, args: { recipientName: string; recipientAccount: string; amount: number; note?: string }) => {
      // Validate transfer safely first
      const validation = await TransfersService.validateTransfer({
        userId,
        recipientName: args.recipientName,
        recipientAccount: args.recipientAccount,
        amount: args.amount,
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      return {
        draftType: 'TRANSFER',
        recipientName: args.recipientName,
        recipientAccount: args.recipientAccount,
        recipientBank: 'FinPilot',
        amount: args.amount,
        fee: 0.0,
        currency: 'PKR',
        note: args.note || `Transfer to ${args.recipientName}`,
        summary: `Transfer PKR ${args.amount.toLocaleString()} to ${args.recipientName} (${args.recipientAccount})`,
      };
    },
  },

  // --- RESTRICTED TOOLS (Enforces explicit approval & permission checks) ---
  execute_approved_transfer: {
    name: 'execute_approved_transfer',
    type: 'RESTRICTED',
    description: 'Executes a pre-approved transfer through the banking core with atomic double-entry verification',
    parameters: {
      type: 'object',
      properties: {
        actionId: { type: 'string' },
        approvalId: { type: 'string' },
        recipientName: { type: 'string' },
        recipientAccount: { type: 'string' },
        amount: { type: 'number' },
        note: { type: 'string' },
      },
    },
    requiresApproval: true,
    execute: async (userId: string, args: { actionId: string; approvalId: string; recipientName: string; recipientAccount: string; amount: number; note?: string }) => {
      // Enforce server-side verification: action must be in APPROVED state
      const action = await prisma.agentAction.findUnique({
        where: { id: args.actionId },
      });

      if (!action || action.userId !== userId) {
        throw new Error('Unauthorized or invalid agent action');
      }

      if (action.status !== 'APPROVED') {
        throw new Error(`Cannot execute transfer. Action status is ${action.status}, not APPROVED.`);
      }

      // Execute transfer with banking core
      const result = await TransfersService.executeTransfer({
        userId,
        recipientName: args.recipientName,
        recipientAccount: args.recipientAccount,
        amount: args.amount,
        note: args.note,
        approvalId: args.approvalId,
        idempotencyKey: `AGENT-ACT-${action.id}`,
      });

      return result;
    },
  },

  freeze_card: {
    name: 'freeze_card',
    type: 'RESTRICTED',
    description: 'Freeze or unfreeze a payment card for fraud prevention and security',
    parameters: {
      type: 'object',
      properties: {
        cardId: { type: 'string' },
      },
    },
    requiresApproval: true,
    execute: async (userId: string, args: { cardId?: string }) => {
      const card = args?.cardId
        ? await prisma.card.findUnique({ where: { id: args.cardId } })
        : await prisma.card.findFirst({ where: { userId } });

      if (!card || card.userId !== userId) {
        throw new Error('Card not found or access unauthorized');
      }

      const updated = await prisma.card.update({
        where: { id: card.id },
        data: { isFrozen: true },
      });

      await AuditService.log({
        userId,
        actorType: 'AI_AGENT',
        action: 'CARD_FROZEN_BY_AGENT',
        entityType: 'CARD',
        entityId: card.id,
        details: { reason: 'Fraud containment / user agent request' },
      });

      return {
        cardId: updated.id,
        cardNumberMasked: updated.cardNumberMasked,
        isFrozen: updated.isFrozen,
        message: `Card ${updated.cardNumberMasked} has been securely frozen.`,
      };
    },
  },
};
