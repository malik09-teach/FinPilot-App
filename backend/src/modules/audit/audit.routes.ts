import { Router, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';
import { AuthRequest, authenticate } from '../../middleware/auth.js';

export const auditRouter = Router();
auditRouter.use(authenticate);

auditRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await AuditService.getLogs(req.user!.userId);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});
