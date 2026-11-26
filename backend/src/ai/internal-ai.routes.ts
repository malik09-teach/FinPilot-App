import crypto from 'node:crypto';
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AuditService } from '../modules/audit/audit.service.js';
import {
  InternalAiRequest,
  requireAgentContext,
  requireServiceToken,
} from '../middleware/service-auth.js';
import { getToolManifest, toolRegistry } from './tools/registry.js';

export const internalAiRouter = Router();

internalAiRouter.use(requireServiceToken);

internalAiRouter.get('/tools', (_req, res: Response) => {
  res.json({
    success: true,
    tools: getToolManifest(),
  });
});

const invokeBodySchema = z.object({
  args: z.record(z.string(), z.unknown()).optional().default({}),
});

function mapDraftToActionType(toolName: string): {
  actionType: string;
  approvalMethod: 'PIN' | 'MANUAL';
} {
  switch (toolName) {
    case 'create_transfer_draft':
      return { actionType: 'TRANSFER', approvalMethod: 'PIN' };
    case 'create_freeze_card_draft':
      return { actionType: 'FREEZE_CARD', approvalMethod: 'PIN' };
    case 'create_savings_goal_draft':
      return { actionType: 'CREATE_SAVING_GOAL', approvalMethod: 'MANUAL' };
    case 'create_budget_draft':
      return { actionType: 'CREATE_BUDGET', approvalMethod: 'MANUAL' };
    default:
      return { actionType: toolName.toUpperCase(), approvalMethod: 'MANUAL' };
  }
}

internalAiRouter.post(
  '/tools/:name/invoke',
  requireAgentContext,
  async (req: InternalAiRequest, res: Response) => {
    const toolName = String(req.params.name || '');
    const ctx = req.agentContext!;
    const tool = toolRegistry[toolName];

    if (!tool || tool.type === 'RESTRICTED') {
      await AuditService.log({
        userId: ctx.userId,
        actorType: 'AI_AGENT',
        action: 'AI_TOOL_BLOCKED',
        entityType: 'AGENT_ACTION',
        details: { toolName, requestId: ctx.requestId, reason: 'Unknown or RESTRICTED tool' },
      });
      res.status(403).json({
        success: false,
        error: `Tool '${toolName}' is not permitted`,
      });
      return;
    }

    const bodyParsed = invokeBodySchema.safeParse(req.body ?? {});
    if (!bodyParsed.success) {
      res.status(400).json({ success: false, error: 'Invalid invoke payload' });
      return;
    }

    const argsParsed = tool.schema.safeParse(bodyParsed.data.args);
    if (!argsParsed.success) {
      res.status(400).json({
        success: false,
        error: argsParsed.error.issues.map((i) => i.message).join('; '),
      });
      return;
    }

    const argsHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(argsParsed.data))
      .digest('hex')
      .slice(0, 16);

    try {
      const result = await tool.execute(ctx.userId, argsParsed.data);

      await AuditService.log({
        userId: ctx.userId,
        actorType: 'AI_AGENT',
        action: 'AI_TOOL_INVOKED',
        entityType: 'AGENT_ACTION',
        details: { toolName, argsHash, status: 'OK', requestId: ctx.requestId },
      });

      if (tool.type === 'DRAFT') {
        const { actionType, approvalMethod } = mapDraftToActionType(toolName);
        const normalizedPayload =
          toolName === 'create_budget_draft'
            ? {
                month: new Date().toISOString().slice(0, 7),
                totalLimit: result.proposedTotalLimit,
                categories: result.proposedCategories,
                summary: result.summary,
              }
            : result;

        const action = await prisma.agentAction.create({
          data: {
            sessionId: ctx.sessionId,
            userId: ctx.userId,
            actionType,
            status: 'AWAITING_APPROVAL',
            payload: JSON.stringify(normalizedPayload),
            requiredApproval: true,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });

        await prisma.agentApproval.create({
          data: {
            actionId: action.id,
            userId: ctx.userId,
            status: 'PENDING',
            approvalMethod,
          },
        });

        await AuditService.log({
          userId: ctx.userId,
          actorType: 'AI_AGENT',
          action: 'AGENT_ACTION_PLANNED',
          entityType: 'AGENT_ACTION',
          entityId: action.id,
          details: { actionType, requestId: ctx.requestId, toolName },
        });

        res.json({
          success: true,
          data: result,
          action: {
            id: action.id,
            actionType: action.actionType,
            status: action.status,
            summary: String(result.summary || action.actionType),
            requiredApproval: true,
          },
        });
        return;
      }

      res.json({ success: true, data: result });
    } catch (err: any) {
      await AuditService.log({
        userId: ctx.userId,
        actorType: 'AI_AGENT',
        action: 'AI_TOOL_FAILED',
        entityType: 'AGENT_ACTION',
        details: {
          toolName,
          argsHash,
          status: 'ERROR',
          error: err?.message || 'Unknown error',
          requestId: ctx.requestId,
        },
      });
      res.status(400).json({
        success: false,
        error: err?.message || 'Tool execution failed',
      });
    }
  }
);
