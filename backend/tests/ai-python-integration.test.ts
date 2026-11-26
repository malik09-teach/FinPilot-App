import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { prisma } from '../src/config/prisma.js';
import { signAgentContextToken } from '../src/ai/agent-context.js';
import { pythonCircuitBreaker } from '../src/ai/python-gateway.service.js';

describe('Backend <-> Python AI Integration & Security', () => {
  const userId = 'usr_temoor_01';
  const serviceToken = process.env.AGENT_SERVICE_TOKEN || 'dev-agent-service-token';

  beforeEach(() => {
    pythonCircuitBreaker.reset();
    jest.restoreAllMocks();
  });

  test('Manifest excludes RESTRICTED tools and contains no user_id fields', async () => {
    const res = await request(app)
      .get('/internal/ai/tools')
      .set('X-Service-Token', serviceToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const tools: Array<{ name: string; risk: string; parameters: { properties?: Record<string, unknown> } }> =
      res.body.tools;
    const names = tools.map((t) => t.name);

    expect(names).toContain('get_account_balance');
    expect(names).toContain('create_transfer_draft');
    expect(names).toContain('create_freeze_card_draft');
    expect(names).not.toContain('execute_approved_transfer');
    expect(names).not.toContain('freeze_card');

    for (const tool of tools) {
      expect(['READ', 'DRAFT']).toContain(tool.risk);
      const props = tool.parameters?.properties || {};
      expect(props).not.toHaveProperty('user_id');
      expect(props).not.toHaveProperty('userId');
    }
  });

  test('Service-token and context-token enforcement on /internal/ai/*', async () => {
    // Missing service token
    const r1 = await request(app).get('/internal/ai/tools');
    expect(r1.status).toBe(401);

    // Wrong service token + demo header ignored
    const r2 = await request(app)
      .get('/internal/ai/tools')
      .set('X-Service-Token', 'wrong-token')
      .set('x-demo-user-id', userId);
    expect(r2.status).toBe(401);

    // Missing context token on invoke
    const r3 = await request(app)
      .post('/internal/ai/tools/get_account_balance/invoke')
      .set('X-Service-Token', serviceToken)
      .set('x-demo-user-id', userId)
      .send({ args: {} });
    expect(r3.status).toBe(401);

    // Expired context token
    const expiredToken = signAgentContextToken({
      userId,
      sessionId: 'sess_test',
      requestId: 'req_test',
      ttlSeconds: -10,
    });
    const r4 = await request(app)
      .post('/internal/ai/tools/get_account_balance/invoke')
      .set('X-Service-Token', serviceToken)
      .set('X-Agent-Context', expiredToken)
      .send({ args: {} });
    expect(r4.status).toBe(401);

    // Tampered context token
    const validToken = signAgentContextToken({
      userId,
      sessionId: 'sess_test',
      requestId: 'req_test',
    });
    const tampered = `${validToken.slice(0, -3)}xxx`;
    const r5 = await request(app)
      .post('/internal/ai/tools/get_account_balance/invoke')
      .set('X-Service-Token', serviceToken)
      .set('X-Agent-Context', tampered)
      .send({ args: {} });
    expect(r5.status).toBe(401);
  });

  test('RESTRICTED tool invoke is rejected even with valid tokens', async () => {
    const ctxToken = signAgentContextToken({
      userId,
      sessionId: 'sess_test',
      requestId: 'req_restricted',
    });

    const r1 = await request(app)
      .post('/internal/ai/tools/execute_approved_transfer/invoke')
      .set('X-Service-Token', serviceToken)
      .set('X-Agent-Context', ctxToken)
      .send({ args: {} });
    expect(r1.status).toBe(403);

    const r2 = await request(app)
      .post('/internal/ai/tools/freeze_card/invoke')
      .set('X-Service-Token', serviceToken)
      .set('X-Agent-Context', ctxToken)
      .send({ args: {} });
    expect(r2.status).toBe(403);
  });

  test('x-demo-user-id fallback is disabled when NODE_ENV=production', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await request(app)
        .get('/api/ai/sessions')
        .set('x-demo-user-id', userId);
      expect(res.status).toBe(401);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  test('Chat stream relays SSE from mocked Python service', async () => {
    const sseBody =
      'event: tool_start\ndata: {"tool":"get_account_balance","label":"Checking balance..."}\n\n' +
      'event: tool_end\ndata: {"tool":"get_account_balance","ok":true}\n\n' +
      'event: token\ndata: {"text":"Your balance is PKR 145,000."}\n\n' +
      'event: done\ndata: {"specialist":"financial_analyst"}\n\n';

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseBody));
        controller.close();
      },
    });

    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );

    const res = await request(app)
      .post('/api/ai/chat/stream')
      .set('x-demo-user-id', userId)
      .send({ message: 'What is my balance?' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('event: token');
    expect(res.text).toContain('PKR 145,000');
    expect(res.text).toContain('event: done');
  });

  test('Chat stream falls back to legacy orchestrator when Python is unreachable', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const res = await request(app)
      .post('/api/ai/chat/stream')
      .set('x-demo-user-id', userId)
      .send({ message: 'Summarize my spending' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('event: token');
    expect(res.text).toContain('Total Inflow');
    expect(res.text).toContain('event: done');

    const audit = await prisma.auditLog.findFirst({
      where: { userId, action: 'AI_FALLBACK_LEGACY' },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).not.toBeNull();
  });

  test('End-to-end: draft via internal invoke -> approve with PIN -> COMPLETED -> balanced ledger & audit', async () => {
    const session = await prisma.agentSession.create({
      data: { userId, title: 'E2E Test Session', status: 'ACTIVE' },
    });

    const ctxToken = signAgentContextToken({
      userId,
      sessionId: session.id,
      requestId: `req_e2e_${Date.now()}`,
    });

    // 1. Python invokes create_transfer_draft
    const draftRes = await request(app)
      .post('/internal/ai/tools/create_transfer_draft/invoke')
      .set('X-Service-Token', serviceToken)
      .set('X-Agent-Context', ctxToken)
      .send({
        args: {
          recipientName: 'Ali Khan',
          recipientAccount: '1004892110',
          amount: 1500,
          note: 'E2E Python transfer',
        },
      });

    expect(draftRes.status).toBe(200);
    expect(draftRes.body.action).toBeDefined();
    const actionId = draftRes.body.action.id as string;
    expect(draftRes.body.action.status).toBe('AWAITING_APPROVAL');

    // 2. Approve with PIN 1234
    const approveRes = await request(app)
      .post(`/api/ai/actions/${actionId}/approve`)
      .set('x-demo-user-id', userId)
      .send({ pin: '1234' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.action.status).toBe('COMPLETED');
    const ref = approveRes.body.data.executionResult.reference as string;

    // 3. Verify ledger invariant: sum(DR) == sum(CR)
    const ledger = await prisma.ledgerEntry.findMany({
      where: { reference: { startsWith: ref } },
    });
    const sumDr = ledger.filter((l) => l.type === 'DEBIT').reduce((s, l) => s + l.amount, 0);
    const sumCr = ledger.filter((l) => l.type === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    expect(sumDr).toBe(1500);
    expect(sumCr).toBe(1500);

    // 4. Verify audit entries exist
    const auditApproved = await prisma.auditLog.findFirst({
      where: { userId, entityId: actionId, action: 'AGENT_ACTION_APPROVED_AND_EXECUTED' },
    });
    expect(auditApproved).not.toBeNull();
  });
});
