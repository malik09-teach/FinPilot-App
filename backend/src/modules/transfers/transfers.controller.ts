import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { TransfersService } from './transfers.service.js';
import { AuthRequest } from '../../middleware/auth.js';

const transferSchema = z.object({
  senderAccountId: z.string().optional(),
  recipientAccount: z.string().min(6, 'Recipient account number must be at least 6 digits'),
  recipientName: z.string().min(2, 'Recipient name is required'),
  recipientBank: z.string().optional().default('FinPilot'),
  amount: z.number().positive('Transfer amount must be positive'),
  note: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

const validateSchema = z.object({
  recipientAccount: z.string().min(6),
  amount: z.number().positive(),
});

export class TransfersController {
  static async validate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = validateSchema.parse(req.body);
      const result = await TransfersService.validateTransfer({
        userId: req.user!.userId,
        recipientAccount: data.recipientAccount,
        recipientName: 'Recipient',
        amount: data.amount,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async execute(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = transferSchema.parse(req.body);
      const result = await TransfersService.executeTransfer({
        ...data,
        userId: req.user!.userId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const history = await TransfersService.getTransferHistory(req.user!.userId);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }
}
