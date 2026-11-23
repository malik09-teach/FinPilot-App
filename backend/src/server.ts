import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { accountsRouter } from './modules/accounts/accounts.routes.js';
import { transactionsRouter } from './modules/transactions/transactions.routes.js';
import { transfersRouter } from './modules/transfers/transfers.routes.js';
import { beneficiariesRouter } from './modules/beneficiaries/beneficiaries.routes.js';
import { budgetsRouter } from './modules/budgets/budgets.routes.js';
import { savingGoalsRouter } from './modules/saving-goals/saving-goals.routes.js';
import { cardsRouter } from './modules/cards/cards.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { aiAgentRouter } from './modules/ai-agent/ai-agent.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic rate limiting logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    app: 'FinPilot Banking Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/beneficiaries', beneficiariesRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/saving-goals', savingGoalsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ai', aiAgentRouter);
app.use('/api/audit', auditRouter);

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 FinPilot Banking Backend server running on http://localhost:${PORT}`);
  });
}
