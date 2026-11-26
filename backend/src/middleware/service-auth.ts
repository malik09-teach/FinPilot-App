import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { getEnv } from '../config/env.js';
import { AgentContextPayload, verifyAgentContextToken } from '../ai/agent-context.js';

export interface InternalAiRequest extends Request {
  agentContext?: AgentContextPayload;
}

export function requireServiceToken(req: Request, res: Response, next: NextFunction): void {
  const { AGENT_SERVICE_TOKEN } = getEnv();
  const provided = req.headers['x-service-token'];
  if (typeof provided !== 'string' || !provided) {
    res.status(401).json({ success: false, error: 'Missing X-Service-Token' });
    return;
  }

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(AGENT_SERVICE_TOKEN, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ success: false, error: 'Invalid X-Service-Token' });
    return;
  }

  next();
}

export function requireAgentContext(
  req: InternalAiRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-agent-context'];
  if (typeof token !== 'string' || !token) {
    res.status(401).json({ success: false, error: 'Missing X-Agent-Context token' });
    return;
  }

  try {
    req.agentContext = verifyAgentContextToken(token);
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, error: err?.message || 'Invalid X-Agent-Context token' });
  }
}
