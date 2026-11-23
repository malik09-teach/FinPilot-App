import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AgentOrchestrator } from '../../ai/orchestrator.js';
import { AiAgentService } from './ai-agent.service.js';
import { AuthRequest } from '../../middleware/auth.js';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
});

const approveSchema = z.object({
  pin: z.string().optional(),
});

const rejectSchema = z.object({
  reason: z.string().optional(),
});

export class AiAgentController {
  static async chat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = chatSchema.parse(req.body);
      const result = await AgentOrchestrator.handleUserRequest({
        userId: req.user!.userId,
        sessionId: data.sessionId,
        message: data.message,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await AiAgentService.getSessions(req.user!.userId);
      res.json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  }

  static async getSessionDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const details = await AiAgentService.getSessionDetails(req.user!.userId, sessionId);
      res.json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  static async getPendingActions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actions = await AiAgentService.getPendingActions(req.user!.userId);
      res.json({ success: true, data: actions });
    } catch (err) {
      next(err);
    }
  }

  static async approveAction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = approveSchema.parse(req.body || {});
      const actionId = req.params.actionId as string;
      const result = await AiAgentService.approveAction({
        userId: req.user!.userId,
        actionId,
        pin: data.pin,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async rejectAction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = rejectSchema.parse(req.body || {});
      const actionId = req.params.actionId as string;
      const result = await AiAgentService.rejectAction(req.user!.userId, actionId, data.reason);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
