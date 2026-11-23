import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AuthRequest, authenticate } from '../../middleware/auth.js';

export const beneficiariesRouter = Router();
beneficiariesRouter.use(authenticate);

const createBeneficiarySchema = z.object({
  name: z.string().min(2),
  accountNumber: z.string().min(6),
  bankName: z.string().default('FinPilot'),
  nickname: z.string().optional(),
  isFavorite: z.boolean().optional().default(false),
});

beneficiariesRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.beneficiary.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

beneficiariesRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createBeneficiarySchema.parse(req.body);
    const item = await prisma.beneficiary.create({
      data: {
        userId: req.user!.userId,
        ...data,
      },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

beneficiariesRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.beneficiary.deleteMany({
      where: { id, userId: req.user!.userId },
    });
    res.json({ success: true, message: 'Beneficiary removed' });
  } catch (err) {
    next(err);
  }
});
