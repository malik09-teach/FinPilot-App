import crypto from 'node:crypto';
import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { getEnv } from '../config/env.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { signAgentContextToken } from './agent-context.js';
import { AgentOrchestrator, OrchestrationResult } from './orchestrator.js';

export interface SseEventFrame {
  event: string;
  data: Record<string, any>;
}

class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  private readonly threshold = 3;
  private readonly cooldownMs = 30_000;

  isOpen(): boolean {
    if (this.openUntil === 0) return false;
    if (Date.now() >= this.openUntil) {
      this.openUntil = 0;
      this.failures = 0;
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openUntil = 0;
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.openUntil = Date.now() + this.cooldownMs;
    }
  }

  reset(): void {
    this.failures = 0;
    this.openUntil = 0;
  }
}

export const pythonCircuitBreaker = new CircuitBreaker();

function writeSseFrame(res: Response, event: string, data: Record<string, unknown>): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function parseSseChunk(
  buffer: string,
  onEvent: (ev: SseEventFrame) => void
): string {
  const blocks = buffer.split('\n\n');
  const remainder = blocks.pop() ?? '';
  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventName = 'message';
    let dataLine = '{}';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) {
        eventName = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataLine = line.slice(6).trim();
      }
    }
    try {
      onEvent({ event: eventName, data: JSON.parse(dataLine) });
    } catch {
      // Ignore malformed SSE frame
    }
  }
  return remainder;
}

export class PythonGatewayService {
  private static async ensureSession(userId: string, sessionId?: string) {
    let session = sessionId
      ? await prisma.agentSession.findUnique({ where: { id: sessionId } })
      : await prisma.agentSession.findFirst({
          where: { userId, status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
        });

    if (session && session.userId !== userId) {
      throw new Error('Session not found');
    }

    if (!session) {
      session = await prisma.agentSession.create({
        data: {
          userId,
          title: 'Financial Health & Wealth Copilot',
          status: 'ACTIVE',
        },
      });
    }
    return session;
  }

  static async streamChat(params: {
    userId: string;
    sessionId?: string;
    message: string;
    res: Response;
  }): Promise<void> {
    const { userId, message, res } = params;
    const env = getEnv();
    const requestId = `req_${crypto.randomUUID()}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const session = await this.ensureSession(userId, params.sessionId);

    // Load recent history BEFORE saving the new user message
    const recentHistory = await prisma.agentMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    const historyPayload = recentHistory.reverse().map((m) => ({
      role: m.role as 'USER' | 'ASSISTANT' | 'SYSTEM',
      content: m.content,
    }));

    // Persist user message
    await prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        role: 'USER',
        content: message,
      },
    });

    await AuditService.log({
      userId,
      actorType: 'USER',
      action: 'AI_REQUEST_STARTED',
      entityType: 'AGENT_ACTION',
      details: { requestId, sessionId: session.id, engine: env.AI_ENGINE },
    });

    if (env.AI_ENGINE === 'legacy' || pythonCircuitBreaker.isOpen()) {
      await this.fallbackToLegacy({
        userId,
        sessionId: session.id,
        message,
        requestId,
        reason: env.AI_ENGINE === 'legacy' ? 'AI_ENGINE=legacy' : 'circuit_breaker_open',
        res,
      });
      return;
    }

    const contextToken = signAgentContextToken({
      userId,
      sessionId: session.id,
      requestId,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35_000);
    let receivedFirstToken = false;
    let assistantText = '';
    let lastActionId: string | null = null;

    try {
      const upstream = await fetch(`${env.AGENT_SERVICE_URL.replace(/\/$/, '')}/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': env.AGENT_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          session_id: session.id,
          request_id: requestId,
          message,
          history: historyPayload,
          context_token: contextToken,
          user_id_hint: userId,
        }),
        signal: controller.signal,
      });

      if (!upstream.ok || !upstream.body) {
        throw new Error(`Agent service returned HTTP ${upstream.status}`);
      }

      pythonCircuitBreaker.recordSuccess();
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = parseSseChunk(buffer, (ev) => {
          if (ev.event === 'token') {
            receivedFirstToken = true;
            assistantText += String(ev.data.text || '');
          } else if (ev.event === 'draft_created' && ev.data.actionId) {
            lastActionId = String(ev.data.actionId);
          }
          writeSseFrame(res, ev.event, ev.data);
        });
      }

      if (assistantText.trim() || lastActionId) {
        await prisma.agentMessage.create({
          data: {
            sessionId: session.id,
            role: 'ASSISTANT',
            content: assistantText.trim() || 'Draft prepared for your review.',
            metadata: JSON.stringify({
              requestId,
              actionId: lastActionId,
              engine: 'python',
            }),
          },
        });
      }

      res.end();
    } catch (err: any) {
      pythonCircuitBreaker.recordFailure();
      if (!receivedFirstToken) {
        await this.fallbackToLegacy({
          userId,
          sessionId: session.id,
          message,
          requestId,
          reason: err?.message || 'python_unreachable',
          res,
        });
        return;
      }
      writeSseFrame(res, 'error', {
        code: 'STREAM_INTERRUPTED',
        message: 'Response stream was interrupted. Please try again.',
      });
      writeSseFrame(res, 'done', { requestId, sessionId: session.id });
      res.end();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static async fallbackToLegacy(params: {
    userId: string;
    sessionId: string;
    message: string;
    requestId: string;
    reason: string;
    res: Response;
  }): Promise<void> {
    await AuditService.log({
      userId: params.userId,
      actorType: 'SYSTEM',
      action: 'AI_FALLBACK_LEGACY',
      entityType: 'AGENT_ACTION',
      details: { requestId: params.requestId, reason: params.reason },
    });

    const result = await AgentOrchestrator.handleUserRequest({
      userId: params.userId,
      sessionId: params.sessionId,
      message: params.message,
      skipUserMessagePersist: true,
    });

    if (result.action) {
      writeSseFrame(params.res, 'draft_created', {
        actionId: result.action.id,
        actionType: result.action.actionType,
        summary: result.action.summary,
      });
    }
    writeSseFrame(params.res, 'token', { text: result.assistantMessage });
    writeSseFrame(params.res, 'done', {
      requestId: params.requestId,
      sessionId: result.sessionId,
      specialist: 'legacy',
    });
    params.res.end();
  }

  static async chatJson(params: {
    userId: string;
    sessionId?: string;
    message: string;
  }): Promise<OrchestrationResult> {
    const env = getEnv();
    if (env.AI_ENGINE === 'legacy' || pythonCircuitBreaker.isOpen()) {
      return AgentOrchestrator.handleUserRequest(params);
    }

    const requestId = `req_${crypto.randomUUID()}`;
    const session = await this.ensureSession(params.userId, params.sessionId);
    const recentHistory = await prisma.agentMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    const historyPayload = recentHistory.reverse().map((m) => ({
      role: m.role as 'USER' | 'ASSISTANT' | 'SYSTEM',
      content: m.content,
    }));

    await prisma.agentMessage.create({
      data: { sessionId: session.id, role: 'USER', content: params.message },
    });

    const contextToken = signAgentContextToken({
      userId: params.userId,
      sessionId: session.id,
      requestId,
    });

    try {
      const upstream = await fetch(`${env.AGENT_SERVICE_URL.replace(/\/$/, '')}/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': env.AGENT_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          session_id: session.id,
          request_id: requestId,
          message: params.message,
          history: historyPayload,
          context_token: contextToken,
          user_id_hint: params.userId,
        }),
      });
      if (!upstream.ok) {
        throw new Error(`Agent service HTTP ${upstream.status}`);
      }
      pythonCircuitBreaker.recordSuccess();
      const raw = await upstream.text();
      let assistantText = '';
      let specialist = 'financial_analyst';
      let draftActionId: string | null = null;

      parseSseChunk(`${raw}\n\n`, (ev) => {
        if (ev.event === 'token') assistantText += String(ev.data.text || '');
        if (ev.event === 'draft_created' && ev.data.actionId) {
          draftActionId = String(ev.data.actionId);
        }
        if (ev.event === 'done' && ev.data.specialist) {
          specialist = String(ev.data.specialist);
        }
      });

      const finalContent = assistantText.trim() || 'Request processed.';
      await prisma.agentMessage.create({
        data: {
          sessionId: session.id,
          role: 'ASSISTANT',
          content: finalContent,
          metadata: JSON.stringify({ requestId, actionId: draftActionId, engine: 'python' }),
        },
      });

      let actionPayload: OrchestrationResult['action'] | undefined;
      if (draftActionId) {
        const act = await prisma.agentAction.findUnique({ where: { id: draftActionId } });
        if (act) {
          const parsedPayload = JSON.parse(act.payload);
          actionPayload = {
            id: act.id,
            actionType: act.actionType,
            status: act.status,
            payload: parsedPayload,
            summary: String(parsedPayload.summary || act.actionType),
            requiredApproval: act.requiredApproval,
          };
        }
      }

      return {
        sessionId: session.id,
        userMessage: params.message,
        assistantMessage: finalContent,
        intent: specialist.toUpperCase(),
        workflowSteps: [],
        agentOutputs: {},
        action: actionPayload,
      };
    } catch (err: any) {
      pythonCircuitBreaker.recordFailure();
      await AuditService.log({
        userId: params.userId,
        actorType: 'SYSTEM',
        action: 'AI_FALLBACK_LEGACY',
        entityType: 'AGENT_ACTION',
        details: { requestId, reason: err?.message || 'python_unreachable' },
      });
      return AgentOrchestrator.handleUserRequest({
        userId: params.userId,
        sessionId: session.id,
        message: params.message,
        skipUserMessagePersist: true,
      });
    }
  }
}
