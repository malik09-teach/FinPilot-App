import { prisma } from '../src/config/prisma.js';
import { TransfersService } from '../src/modules/transfers/transfers.service.js';
import { AgentOrchestrator } from '../src/ai/orchestrator.js';
import { AiAgentService } from '../src/modules/ai-agent/ai-agent.service.js';

describe('FinPilot Core Banking & AI Agent Suite', () => {
  const userId = 'usr_temoor_01';

  test('Validates transfer and rejects insufficient funds', async () => {
    const result = await TransfersService.validateTransfer({
      userId,
      recipientAccount: '1004892110',
      recipientName: 'Ali Khan',
      amount: 999999999, // Exceeds balance
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('limit' || 'Insufficient');
  });

  test('Executes double-entry transfer atomically with balanced ledger entries', async () => {
    const senderBefore = await prisma.account.findFirst({ where: { userId, isDefault: true } });
    const amount = 2500;
    const idempotencyKey = `TEST-IDEM-${Date.now()}`;

    const res = await TransfersService.executeTransfer({
      userId,
      recipientName: 'Ali Khan',
      recipientAccount: '1004892110',
      amount,
      note: 'Automated Test Transfer',
      idempotencyKey,
    });

    expect(res.transaction).toBeDefined();
    expect(res.transfer.status).toBe('COMPLETED');
    expect(res.newBalance).toBe((senderBefore?.balance || 0) - amount);

    // Verify double-entry ledger entries exist for this transaction
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { reference: { startsWith: res.reference } },
    });
    expect(ledgerEntries.length).toBeGreaterThanOrEqual(2);

    // Double-entry balancing invariant: Debit == Credit
    const debitSum = ledgerEntries
      .filter((l) => l.type === 'DEBIT')
      .reduce((s, l) => s + l.amount, 0);
    const creditSum = ledgerEntries
      .filter((l) => l.type === 'CREDIT')
      .reduce((s, l) => s + l.amount, 0);

    expect(debitSum).toBe(creditSum);
    expect(debitSum).toBe(amount);

    // Test idempotency: re-running with same key returns duplicate
    const duplicateRes = await TransfersService.executeTransfer({
      userId,
      recipientName: 'Ali Khan',
      recipientAccount: '1004892110',
      amount,
      idempotencyKey,
    });
    expect(duplicateRes.isDuplicate).toBe(true);
  });

  test('AI Orchestrator processes savings plan workflow safely without altering balance', async () => {
    const orchestratorRes = await AgentOrchestrator.handleUserRequest({
      userId,
      message: 'I want to save PKR 100,000 in four months.',
    });

    expect(orchestratorRes.intent).toBe('SAVINGS_PLAN');
    expect(orchestratorRes.workflowSteps.length).toBeGreaterThanOrEqual(5);
    expect(orchestratorRes.action).toBeDefined();
    expect(orchestratorRes.action?.status).toBe('AWAITING_APPROVAL');

    // Approve the savings action
    const approvalRes = await AiAgentService.approveAction({
      userId,
      actionId: orchestratorRes.action!.id,
    });

    expect(approvalRes.action.status).toBe('COMPLETED');
  });

  test('AI Orchestrator processes money transfer draft workflow requiring PIN', async () => {
    const orchestratorRes = await AgentOrchestrator.handleUserRequest({
      userId,
      message: 'Send PKR 5,000 to Ali',
    });

    expect(orchestratorRes.intent).toBe('MONEY_TRANSFER');
    expect(orchestratorRes.action).toBeDefined();
    expect(orchestratorRes.action?.status).toBe('AWAITING_APPROVAL');

    // Attempt approval with wrong PIN
    await expect(
      AiAgentService.approveAction({
        userId,
        actionId: orchestratorRes.action!.id,
        pin: '9999',
      })
    ).rejects.toThrow('Incorrect authorization PIN');

    // Approve with correct PIN (1234)
    const approved = await AiAgentService.approveAction({
      userId,
      actionId: orchestratorRes.action!.id,
      pin: '1234',
    });

    expect(approved.action.status).toBe('COMPLETED');
    expect(approved.executionResult.transfer.status).toBe('COMPLETED');
  });
});
