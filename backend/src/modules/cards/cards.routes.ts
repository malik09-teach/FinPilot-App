import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AuthRequest, authenticate } from '../../middleware/auth.js';
import { AuditService } from '../audit/audit.service.js';

export const cardsRouter = Router();
cardsRouter.use(authenticate);

cardsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cards = await prisma.card.findMany({
      where: { userId: req.user!.userId },
    });
    res.json({ success: true, data: cards });
  } catch (err) {
    next(err);
  }
});

cardsRouter.post('/:id/freeze', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const card = await prisma.card.findUnique({ where: { id } });
    if (!card || card.userId !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }

    const updated = await prisma.card.update({
      where: { id: card.id },
      data: { isFrozen: !card.isFrozen },
    });

    await AuditService.log({
      userId: req.user!.userId,
      actorType: 'USER',
      action: updated.isFrozen ? 'CARD_FROZEN' : 'CARD_UNFROZEN',
      entityType: 'CARD',
      entityId: card.id,
      details: { isFrozen: updated.isFrozen },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

const limitSchema = z.object({
  dailyLimit: z.number().positive(),
});

cardsRouter.post('/:id/limit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = limitSchema.parse(req.body);
    const card = await prisma.card.findUnique({ where: { id } });
    if (!card || card.userId !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }

    const updated = await prisma.card.update({
      where: { id: card.id },
      data: { dailyLimit: data.dailyLimit },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
