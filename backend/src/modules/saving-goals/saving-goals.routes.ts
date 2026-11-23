import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AuthRequest, authenticate } from '../../middleware/auth.js';

export const savingGoalsRouter = Router();
savingGoalsRouter.use(authenticate);

const createGoalSchema = z.object({
  name: z.string().min(2),
  targetAmount: z.number().positive(),
  deadline: z.string().optional(),
  category: z.string().optional().default('GENERAL'),
});

const depositGoalSchema = z.object({
  amount: z.number().positive(),
});

savingGoalsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goals = await prisma.savingGoal.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
});

savingGoalsRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createGoalSchema.parse(req.body);
    const goal = await prisma.savingGoal.create({
      data: {
        userId: req.user!.userId,
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        category: data.category,
      },
    });
    res.json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
});

savingGoalsRouter.post('/:id/deposit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = depositGoalSchema.parse(req.body);
    const goal = await prisma.savingGoal.findUnique({ where: { id } });
    if (!goal || goal.userId !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    const updated = await prisma.savingGoal.update({
      where: { id: goal.id },
      data: {
        currentAmount: { increment: data.amount },
        status: goal.currentAmount + data.amount >= goal.targetAmount ? 'COMPLETED' : 'ACTIVE',
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
