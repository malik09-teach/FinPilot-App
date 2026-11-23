import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AuthRequest, authenticate } from '../../middleware/auth.js';

export const budgetsRouter = Router();
budgetsRouter.use(authenticate);

const budgetSchema = z.object({
  month: z.string(), // "2026-11"
  totalLimit: z.number().positive(),
  categories: z.array(
    z.object({
      category: z.string(),
      allocatedAmount: z.number().positive(),
    })
  ),
});

budgetsRouter.get('/current', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let budget = await prisma.budget.findFirst({
      where: { userId: req.user!.userId, month: currentMonth },
      include: { categories: true },
    });

    if (!budget) {
      // Find latest budget if available
      budget = await prisma.budget.findFirst({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        include: { categories: true },
      });
    }

    res.json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
});

budgetsRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = budgetSchema.parse(req.body);
    // Upsert or create
    const existing = await prisma.budget.findFirst({
      where: { userId: req.user!.userId, month: data.month },
    });

    if (existing) {
      await prisma.budgetCategory.deleteMany({ where: { budgetId: existing.id } });
      const updated = await prisma.budget.update({
        where: { id: existing.id },
        data: {
          totalLimit: data.totalLimit,
          categories: {
            create: data.categories.map((c) => ({
              category: c.category,
              allocatedAmount: c.allocatedAmount,
              spentAmount: 0,
            })),
          },
        },
        include: { categories: true },
      });
      return res.json({ success: true, data: updated });
    }

    const created = await prisma.budget.create({
      data: {
        userId: req.user!.userId,
        month: data.month,
        totalLimit: data.totalLimit,
        categories: {
          create: data.categories.map((c) => ({
            category: c.category,
            allocatedAmount: c.allocatedAmount,
            spentAmount: 0,
          })),
        },
      },
      include: { categories: true },
    });

    res.json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});
