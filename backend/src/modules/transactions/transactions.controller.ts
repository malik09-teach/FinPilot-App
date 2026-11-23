import { Response, NextFunction } from 'express';
import { TransactionsService } from './transactions.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export class TransactionsController {
  static async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category, type, search, startDate, endDate, limit, offset } = req.query;
      const result = await TransactionsService.getTransactions(req.user!.userId, {
        category: category as string,
        type: type as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getRecent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const transactions = await TransactionsService.getRecent(req.user!.userId, limit);
      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }

  static async getTransactionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const tx = await TransactionsService.getTransactionById(req.user!.userId, id);
      res.json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  }

  static async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await TransactionsService.getAnalytics(req.user!.userId);
      res.json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  }
}
