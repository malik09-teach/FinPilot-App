import { Platform } from 'react-native';
import { api } from './api';

export interface AiSseEvent {
  event: 'token' | 'tool_start' | 'tool_end' | 'draft_created' | 'error' | 'done';
  data: Record<string, any>;
}

export interface StoredAgentAction {
  id: string;
  sessionId: string;
  actionType: string;
  status: string;
  payload: string;
  requiredApproval: boolean;
  expiresAt?: string | null;
}

function parseSseFrames(
  buffer: string,
  onEvent: (ev: AiSseEvent) => void
): string {
  const blocks = buffer.split('\n\n');
  const remainder = blocks.pop() ?? '';
  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventName = 'token';
    let dataStr = '{}';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) {
        eventName = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataStr = line.slice(6).trim();
      }
    }
    try {
      onEvent({
        event: eventName as AiSseEvent['event'],
        data: JSON.parse(dataStr),
      });
    } catch {
      // Ignore malformed frame
    }
  }
  return remainder;
}

async function getStreamingFetch(): Promise<typeof fetch> {
  if (Platform.OS !== 'web') {
    try {
      const expoFetchModule = await import('expo/fetch');
      if (typeof expoFetchModule.fetch === 'function') {
        return expoFetchModule.fetch as unknown as typeof fetch;
      }
    } catch {
      // Fallback to global fetch if expo/fetch is unavailable
    }
  }
  return fetch;
}

export async function streamAiChat(params: {
  message: string;
  sessionId?: string | null;
  signal?: AbortSignal;
  onEvent: (ev: AiSseEvent) => void;
}): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  const token = api.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchImpl = await getStreamingFetch();
  const res = await fetchImpl(`${api.getBaseUrl()}/ai/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: params.message,
      sessionId: params.sessionId || undefined,
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSseFrames(buffer, params.onEvent);
    }
    if (buffer.trim()) {
      parseSseFrames(`${buffer}\n\n`, params.onEvent);
    }
    return;
  }

  // Fallback for environments without ReadableStream body
  const fallback = await api.sendAiMessage(params.message, params.sessionId || undefined);
  if (fallback.action) {
    params.onEvent({
      event: 'draft_created',
      data: {
        actionId: fallback.action.id,
        actionType: fallback.action.actionType,
        summary: fallback.action.summary,
      },
    });
  }
  params.onEvent({ event: 'token', data: { text: fallback.assistantMessage } });
  params.onEvent({
    event: 'done',
    data: { sessionId: fallback.sessionId, specialist: fallback.intent },
  });
}

export async function fetchPendingActions(): Promise<StoredAgentAction[]> {
  const headers: Record<string, string> = {};
  const token = api.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${api.getBaseUrl()}/ai/pending-actions`, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}
