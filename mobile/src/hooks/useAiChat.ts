import { useCallback, useRef, useState } from 'react';
import { api } from '../services/api';
import { fetchPendingActions, streamAiChat } from '../services/ai.api';
import { AiActionCardData, useAiStore } from '../store/ai-store';
import { useBankStore } from '../store/bank-store';

export function useAiChat() {
  const {
    sessionId,
    messages,
    isStreaming,
    activeTools,
    error,
    setSessionId,
    addUserMessage,
    startAssistantMessage,
    appendAssistantToken,
    attachActionToMessage,
    updateActionStatus,
    upsertToolChip,
    clearToolChips,
    setStreaming,
    setError,
  } = useAiStore();

  const { loadInitialData } = useBankStore();
  const abortRef = useRef<AbortController | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, [setStreaming]);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isStreaming) return;

      setError(null);
      setLastFailedPrompt(null);
      clearToolChips();

      addUserMessage({
        id: `usr_${Date.now()}`,
        role: 'user',
        content: text,
      });

      const assistantId = `ast_${Date.now()}`;
      startAssistantMessage(assistantId);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamAiChat({
          message: text,
          sessionId,
          signal: controller.signal,
          onEvent: async (ev) => {
            if (ev.event === 'token') {
              appendAssistantToken(assistantId, String(ev.data.text || ''));
            } else if (ev.event === 'tool_start') {
              upsertToolChip(
                String(ev.data.tool || 'tool'),
                String(ev.data.label || 'Working...'),
                'running'
              );
            } else if (ev.event === 'tool_end') {
              const toolName = String(ev.data.tool || 'tool');
              upsertToolChip(
                toolName,
                toolName.replace(/_/g, ' '),
                ev.data.ok ? 'done' : 'error'
              );
            } else if (ev.event === 'draft_created') {
              const actionId = String(ev.data.actionId || '');
              const actionType = String(ev.data.actionType || 'ACTION');
              let card: AiActionCardData = {
                id: actionId,
                actionType,
                summary: String(ev.data.summary || actionType),
                requiresPin: actionType === 'TRANSFER' || actionType === 'FREEZE_CARD',
                uiStatus: 'awaiting',
              };
              // Hydrate from stored AgentAction (authoritative backend data, never model text)
              try {
                const pending = await fetchPendingActions();
                const stored = pending.find((p) => p.id === actionId);
                if (stored) {
                  const parsed = JSON.parse(stored.payload || '{}');
                  card = {
                    id: stored.id,
                    actionType: stored.actionType,
                    summary: String(parsed.summary || card.summary),
                    amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
                    recipientName: parsed.recipientName,
                    recipientAccount: parsed.recipientAccount,
                    fee: typeof parsed.fee === 'number' ? parsed.fee : undefined,
                    expiresAt: stored.expiresAt,
                    requiresPin:
                      stored.actionType === 'TRANSFER' ||
                      stored.actionType === 'FREEZE_CARD',
                    uiStatus: 'awaiting',
                  };
                }
              } catch {
                // Keep minimal stored summary from SSE draft_created
              }
              attachActionToMessage(assistantId, card);
            } else if (ev.event === 'error') {
              setError(String(ev.data.message || 'AI service error. Please try again.'));
            } else if (ev.event === 'done' && ev.data.sessionId) {
              setSessionId(String(ev.data.sessionId));
            }
          },
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          appendAssistantToken(assistantId, '\n\n[Stopped]');
        } else {
          const msg = String(err?.message || '').toLowerCase();
          const isOffline =
            msg.includes('network') || msg.includes('failed to fetch') || msg.includes('abort');
          setError(
            isOffline
              ? 'AI needs a connection. Please check your network and retry.'
              : 'Unable to reach FinPilot AI right now. Please retry.'
          );
          setLastFailedPrompt(text);
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [
      isStreaming,
      sessionId,
      setError,
      clearToolChips,
      addUserMessage,
      startAssistantMessage,
      setStreaming,
      appendAssistantToken,
      upsertToolChip,
      attachActionToMessage,
      setSessionId,
    ]
  );

  const retryLast = useCallback(() => {
    if (lastFailedPrompt) {
      void sendMessage(lastFailedPrompt);
    }
  }, [lastFailedPrompt, sendMessage]);

  const approveAction = useCallback(
    async (actionId: string, pin?: string) => {
      updateActionStatus(actionId, 'verifying');
      try {
        await api.approveAiAction(actionId, pin);
        updateActionStatus(actionId, 'completed');
        await loadInitialData();
      } catch (err: any) {
        updateActionStatus(actionId, 'failed', err?.message || 'Approval failed');
      }
    },
    [updateActionStatus, loadInitialData]
  );

  const rejectAction = useCallback(
    async (actionId: string) => {
      updateActionStatus(actionId, 'verifying');
      try {
        await api.rejectAiAction(actionId, 'Declined by user');
        updateActionStatus(actionId, 'rejected');
      } catch (err: any) {
        updateActionStatus(actionId, 'failed', err?.message || 'Could not decline action');
      }
    },
    [updateActionStatus]
  );

  return {
    messages,
    isStreaming,
    activeTools,
    error,
    canRetry: Boolean(lastFailedPrompt),
    sendMessage,
    stopStreaming,
    retryLast,
    approveAction,
    rejectAction,
  };
}
