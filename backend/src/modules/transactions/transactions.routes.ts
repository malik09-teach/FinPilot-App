import { Router } from 'express';
import { TransactionsController } from './transactions.controller.js';
import { authenticate } from '../../middleware/auth.js';

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);
transactionsRouter.get('/', TransactionsController.getTransactions);
transactionsRouter.get('/recent', TransactionsController.getRecent);
transactionsRouter.get('/analytics', TransactionsController.getAnalytics);
transactionsRouter.get('/:id', TransactionsController.getTransactionById);
