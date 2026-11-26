import { create } from 'zustand';

export const AI_PIN_LENGTH = 4;

export type ActionUiStatus =
  | 'awaiting'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface AiActionCardData {
  id: string;
  actionType: string;
  summary: string;
  amount?: number;
  recipientName?: string;
  recipientAccount?: string;
  fee?: number;
  expiresAt?: string | null;
  requiresPin: boolean;
  uiStatus: ActionUiStatus;
  errorMessage?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: AiActionCardData;
}

export interface ActiveToolChip {
  tool: string;
  label: string;
  status: 'running' | 'done' | 'error';
}

interface AiState {
  sessionId: string | null;
  messages: AiChatMessage[];
  isStreaming: boolean;
  activeTools: ActiveToolChip[];
  error: string | null;

  setSessionId: (id: string | null) => void;
  addUserMessage: (msg: AiChatMessage) => void;
  startAssistantMessage: (id: string) => void;
  appendAssistantToken: (id: string, text: string) => void;
  attachActionToMessage: (id: string, action: AiActionCardData) => void;
  updateActionStatus: (actionId: string, status: ActionUiStatus, errorMessage?: string) => void;
  upsertToolChip: (tool: string, label: string, status: ActiveToolChip['status']) => void;
  clearToolChips: () => void;
  setStreaming: (val: boolean) => void;
  setError: (err: string | null) => void;
  clearAiState: () => void;
}

const WELCOME_MESSAGE: AiChatMessage = {
  id: 'welcome_ai_01',
  role: 'assistant',
  content:
    'Hello! I am FinPilot AI Copilot. Ask me about your balance, spending, budgets, savings goals, subscriptions, or to prepare a transfer.',
};

export const useAiStore = create<AiState>((set) => ({
  sessionId: null,
  messages: [WELCOME_MESSAGE],
  isStreaming: false,
  activeTools: [],
  error: null,

  setSessionId: (id) => set({ sessionId: id }),

  addUserMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg], error: null })),

  startAssistantMessage: (id) =>
    set((state) => ({
      messages: [...state.messages, { id, role: 'assistant', content: '' }],
    })),

  appendAssistantToken: (id, text) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      ),
    })),

  attachActionToMessage: (id, action) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, action } : m
      ),
    })),

  updateActionStatus: (actionId, status, errorMessage) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.action && m.action.id === actionId
          ? {
              ...m,
              action: { ...m.action, uiStatus: status, errorMessage },
            }
          : m
      ),
    })),

  upsertToolChip: (tool, label, status) =>
    set((state) => {
      const exists = state.activeTools.some((t) => t.tool === tool);
      if (exists) {
        return {
          activeTools: state.activeTools.map((t) =>
            t.tool === tool ? { ...t, label, status } : t
          ),
        };
      }
      return {
        activeTools: [...state.activeTools, { tool, label, status }],
      };
    }),

  clearToolChips: () => set({ activeTools: [] }),
  setStreaming: (val) => set({ isStreaming: val }),
  setError: (err) => set({ error: err }),
  clearAiState: () =>
    set({
      sessionId: null,
      messages: [WELCOME_MESSAGE],
      isStreaming: false,
      activeTools: [],
      error: null,
    }),
}));
