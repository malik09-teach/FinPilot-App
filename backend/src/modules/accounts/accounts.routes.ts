import { Router } from 'express';
import { AccountsController } from './accounts.controller.js';
import { authenticate } from '../../middleware/auth.js';

export const accountsRouter = Router();

accountsRouter.use(authenticate);
accountsRouter.get('/', AccountsController.getAccounts);
accountsRouter.get('/default', AccountsController.getDefaultAccount);
accountsRouter.get('/balance', AccountsController.getBalance);
accountsRouter.post('/load-money', AccountsController.loadMoney);
