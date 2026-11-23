import { Router } from 'express';
import { TransfersController } from './transfers.controller.js';
import { authenticate } from '../../middleware/auth.js';

export const transfersRouter = Router();

transfersRouter.use(authenticate);
transfersRouter.post('/validate', TransfersController.validate);
transfersRouter.post('/execute', TransfersController.execute);
transfersRouter.get('/history', TransfersController.getHistory);
