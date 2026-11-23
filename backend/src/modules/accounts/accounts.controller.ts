import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AccountsService } from './accounts.service.js';
import { AuthRequest } from '../../middleware/auth.js';

const loadMoneySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  sourceName: z.string().optional(),
});

export class AccountsController {
  static async getAccounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const accounts = await AccountsService.getUserAccounts(req.user!.userId);
      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  static async getDefaultAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const account = await AccountsService.getDefaultAccount(req.user!.userId);
      res.json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  static async getBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const accountId = req.query.accountId as string | undefined;
      const balance = await AccountsService.getBalance(req.user!.userId, accountId);
      res.json({ success: true, data: balance });
    } catch (err) {
      next(err);
    }
  }

  static async loadMoney(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = loadMoneySchema.parse(req.body);
      const result = await AccountsService.loadMoney(req.user!.userId, data.amount, data.sourceName);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
