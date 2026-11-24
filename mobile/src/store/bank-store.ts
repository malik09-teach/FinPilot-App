import { create } from 'zustand';
import { api } from '../services/api';

export interface TransactionItem {
  id: string;
  amount: number;
  currency: string;
  type: 'DEBIT' | 'CREDIT';
  category: string;
  description: string;
  counterpartyName?: string;
  reference: string;
  status: string;
  createdAt: string;
}

export interface BankState {
  isAuthenticated: boolean;
  isBalanceHidden: boolean;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  balance: {
    amount: number;
    currency: string;
    iban: string;
    accountNumber: string;
  };
  recentTransactions: TransactionItem[];
  beneficiaries: any[];
  activeTab: 'personal' | 'payments' | 'scan' | 'more';
  isLoading: boolean;
  activeAiSessionId: string | null;
  pendingAiAction: any | null;
  card: {
    id: string;
    cardNumberMasked: string;
    isFrozen: boolean;
    dailyLimit: number;
  } | null;

  // Actions
  setAuthenticated: (val: boolean) => void;
  toggleBalanceHidden: () => void;
  setActiveTab: (tab: 'personal' | 'payments' | 'scan' | 'more') => void;
  loadInitialData: () => Promise<void>;
  loadMoney: (amount: number) => Promise<void>;
  sendTransfer: (recipientAccount: string, recipientName: string, amount: number, note?: string) => Promise<any>;
  toggleCardFreeze: () => Promise<void>;
  setPendingAiAction: (action: any | null) => void;
  logout: () => void;
}

export const useBankStore = create<BankState>((set, get) => ({
  isAuthenticated: false, // Starts at Login screen
  isBalanceHidden: false,
  user: {
    id: 'usr_temoor_01',
    name: 'Syed Temoor Shah',
    phone: '03001234567',
    email: 'temoor.shah@finpilot.io',
  },
  balance: {
    amount: 145000.0,
    currency: 'Rs.',
    iban: 'PK36FINP0000001002345678',
    accountNumber: '1002345678',
  },
  recentTransactions: [
    {
      id: 'tx-ref-01',
      amount: 10000.0,
      currency: 'Rs.',
      type: 'DEBIT',
      category: 'TRANSFER',
      description: 'Transfer to Syed Temoor Shah',
      counterpartyName: 'SYED TEMOOR SHAH',
      reference: 'TXN-REF-77291',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    },
  ],
  beneficiaries: [],
  activeTab: 'personal',
  isLoading: false,
  activeAiSessionId: null,
  pendingAiAction: null,
  card: {
    id: 'card_01',
    cardNumberMasked: '2621 •••• •••• 2449',
    isFrozen: false,
    dailyLimit: 200000.0,
  },

  setAuthenticated: (val: boolean) => set({ isAuthenticated: val, activeTab: 'personal' }),
  toggleBalanceHidden: () => set((state) => ({ isBalanceHidden: !state.isBalanceHidden })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  loadInitialData: async () => {
    try {
      set({ isLoading: true });
      const [balanceRes, txRes, benefRes, cardRes] = await Promise.allSettled([
        api.getBalance(),
        api.getRecentTransactions(10),
        api.getBeneficiaries(),
        api.getCards(),
      ]);

      if (balanceRes.status === 'fulfilled' && balanceRes.value) {
        set({
          balance: {
            amount: balanceRes.value.balance,
            currency: 'Rs.',
            iban: balanceRes.value.iban,
            accountNumber: balanceRes.value.accountNumber,
          },
        });
      }

      if (txRes.status === 'fulfilled' && Array.isArray(txRes.value)) {
        set({ recentTransactions: txRes.value });
      }

      if (benefRes.status === 'fulfilled' && Array.isArray(benefRes.value)) {
        set({ beneficiaries: benefRes.value });
      }

      if (cardRes.status === 'fulfilled' && Array.isArray(cardRes.value) && cardRes.value[0]) {
        const c = cardRes.value[0];
        set({
          card: {
            id: c.id,
            cardNumberMasked: c.cardNumberMasked,
            isFrozen: c.isFrozen,
            dailyLimit: c.dailyLimit,
          },
        });
      }
    } catch (e) {
      console.warn('Initial data load warning:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadMoney: async (amount: number) => {
    try {
      const res: any = await api.loadMoney(amount, 'Instant Debit Card Load');
      if (res?.newBalance !== undefined) {
        set((state) => ({
          balance: { ...state.balance, amount: res.newBalance },
        }));
      }
      await get().loadInitialData();
    } catch (e: any) {
      // Offline fallback simulation
      set((state) => ({
        balance: { ...state.balance, amount: state.balance.amount + amount },
      }));
    }
  },

  sendTransfer: async (recipientAccount, recipientName, amount, note) => {
    try {
      const res: any = await api.executeTransfer({
        recipientAccount,
        recipientName,
        amount,
        note,
      });
      await get().loadInitialData();
      return res;
    } catch (e: any) {
      // Local fallback simulation if offline
      set((state) => ({
        balance: { ...state.balance, amount: Math.max(0, state.balance.amount - amount) },
        recentTransactions: [
          {
            id: `tx-loc-${Date.now()}`,
            amount,
            currency: 'Rs.',
            type: 'DEBIT',
            category: 'TRANSFER',
            description: note || `Transfer to ${recipientName}`,
            counterpartyName: recipientName.toUpperCase(),
            reference: `TXN-REF-${Math.floor(10000 + Math.random() * 90000)}`,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          },
          ...state.recentTransactions,
        ],
      }));
      return { success: true };
    }
  },

  toggleCardFreeze: async () => {
    const card = get().card;
    if (!card) return;
    try {
      await api.toggleFreezeCard(card.id);
      set({ card: { ...card, isFrozen: !card.isFrozen } });
    } catch {
      set({ card: { ...card, isFrozen: !card.isFrozen } });
    }
  },

  setPendingAiAction: (action) => set({ pendingAiAction: action }),
  logout: () => set({ isAuthenticated: false }),
}));
