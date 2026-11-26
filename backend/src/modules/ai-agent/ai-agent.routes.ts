import { Router } from 'express';
import { AiAgentController } from './ai-agent.controller.js';
import { authenticate } from '../../middleware/auth.js';

export const aiAgentRouter = Router();

aiAgentRouter.use(authenticate);

aiAgentRouter.post('/chat', AiAgentController.chat);
aiAgentRouter.post('/chat/stream', AiAgentController.chatStream);
aiAgentRouter.get('/sessions', AiAgentController.getSessions);
aiAgentRouter.get('/sessions/:sessionId', AiAgentController.getSessionDetails);
aiAgentRouter.get('/pending-actions', AiAgentController.getPendingActions);
aiAgentRouter.post('/actions/:actionId/approve', AiAgentController.approveAction);
aiAgentRouter.post('/actions/:actionId/reject', AiAgentController.rejectAction);
