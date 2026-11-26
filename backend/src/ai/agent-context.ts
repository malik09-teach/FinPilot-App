import crypto from 'node:crypto';
import { getEnv } from '../config/env.js';

export interface AgentContextPayload {
  userId: string;
  sessionId: string;
  requestId: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signAgentContextToken(params: {
  userId: string;
  sessionId: string;
  requestId: string;
  ttlSeconds?: number;
}): string {
  const { AGENT_CONTEXT_SECRET, AGENT_CONTEXT_TTL_SECONDS } = getEnv();
  const now = Math.floor(Date.now() / 1000);
  const ttl = params.ttlSeconds ?? AGENT_CONTEXT_TTL_SECONDS;

  const payload: AgentContextPayload = {
    userId: params.userId,
    sessionId: params.sessionId,
    requestId: params.requestId,
    iat: now,
    exp: now + ttl,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac('sha256', AGENT_CONTEXT_SECRET)
    .update(encodedPayload)
    .digest();
  return `${encodedPayload}.${base64UrlEncode(sig)}`;
}

export function verifyAgentContextToken(token: string): AgentContextPayload {
  const { AGENT_CONTEXT_SECRET } = getEnv();
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Malformed agent context token');
  }

  const [encodedPayload, encodedSig] = parts;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', AGENT_CONTEXT_SECRET).update(encodedPayload).digest()
  );

  const a = Buffer.from(encodedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Invalid agent context token signature');
  }

  const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as AgentContextPayload;
  const now = Math.floor(Date.now() / 1000);
  if (!parsed.userId || !parsed.sessionId || !parsed.requestId || typeof parsed.exp !== 'number') {
    throw new Error('Incomplete agent context token payload');
  }
  if (now > parsed.exp) {
    throw new Error('Agent context token expired');
  }

  return parsed;
}
