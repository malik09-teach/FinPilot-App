const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;
  private demoUserId: string = 'usr_temoor_01';

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  getBaseUrl(): string {
    return BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-demo-user-id': this.demoUserId,
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      console.warn(`[API] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Auth
  async login(phone: string, pin: string) {
    const res: any = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    });
    if (res?.token) this.setToken(res.token);
    return res;
  }

  async verifyPin(pin: string) {
    return this.request<{ isValid: boolean }>('/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async requestOtp(phone: string) {
    return this.request<{ simulatedCode: string; message: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async resetPin(phone: string, code: string, newPin: string) {
    return this.request('/auth/reset-pin', {
      method: 'POST',
      body: JSON.stringify({ phone, code, newPin }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Accounts
  async getBalance() {
    return this.request<{
      accountId: string;
      accountNumber: string;
      iban: string;
      balance: number;
      availableBalance: number;
      currency: string;
    }>('/accounts/balance');
  }

  async loadMoney(amount: number, sourceName?: string) {
    return this.request('/accounts/load-money', {
      method: 'POST',
      body: JSON.stringify({ amount, sourceName }),
    });
  }

  // Transactions
  async getRecentTransactions(limit = 5) {
    return this.request<any[]>(`/transactions/recent?limit=${limit}`);
  }

  async getTransactions(params?: { category?: string; search?: string; type?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ items: any[]; total: number }>(`/transactions?${query}`);
  }

  async getTransactionDetails(id: string) {
    return this.request(`/transactions/${id}`);
  }

  async getAnalytics() {
    return this.request<{
      totalIncome: number;
      totalExpense: number;
      netSavings: number;
      savingsRate: number;
      categories: Array<{ category: string; amount: number; percentage: number }>;
    }>('/transactions/analytics');
  }

  // Transfers
  async validateTransfer(data: { recipientAccount: string; amount: number }) {
    return this.request('/transfers/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeTransfer(data: {
    recipientAccount: string;
    recipientName: string;
    recipientBank?: string;
    amount: number;
    note?: string;
    idempotencyKey?: string;
  }) {
    return this.request('/transfers/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransferHistory() {
    return this.request<any[]>('/transfers/history');
  }

  // Beneficiaries
  async getBeneficiaries() {
    return this.request<any[]>('/beneficiaries');
  }

  async addBeneficiary(data: { name: string; accountNumber: string; bankName?: string; nickname?: string }) {
    return this.request('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Budgets
  async getCurrentBudget() {
    return this.request<any>('/budgets/current');
  }

  async createBudget(data: { month: string; totalLimit: number; categories: Array<{ category: string; allocatedAmount: number }> }) {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Saving Goals
  async getSavingGoals() {
    return this.request<any[]>('/saving-goals');
  }

  async createSavingGoal(data: { name: string; targetAmount: number; deadline?: string; category?: string }) {
    return this.request('/saving-goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async depositToGoal(goalId: string, amount: number) {
    return this.request(`/saving-goals/${goalId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Cards
  async getCards() {
    return this.request<any[]>('/cards');
  }

  async toggleFreezeCard(cardId: string) {
    return this.request(`/cards/${cardId}/freeze`, { method: 'POST' });
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  // AI Agent
  async sendAiMessage(message: string, sessionId?: string) {
    return this.request<{
      sessionId: string;
      userMessage: string;
      assistantMessage: string;
      intent: string;
      workflowSteps: Array<{
        step: number;
        title: string;
        agent: string;
        status: string;
        description?: string;
      }>;
      agentOutputs: Record<string, any>;
      action?: {
        id: string;
        actionType: string;
        status: string;
        payload: any;
        summary: string;
        requiredApproval: boolean;
      };
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  async getAiSessions() {
    return this.request<any[]>('/ai/sessions');
  }

  async getAiSessionDetails(sessionId: string) {
    return this.request<any>(`/ai/sessions/${sessionId}`);
  }

  async approveAiAction(actionId: string, pin?: string) {
    return this.request<{ action: any; executionResult: any }>(`/ai/actions/${actionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async rejectAiAction(actionId: string, reason?: string) {
    return this.request(`/ai/actions/${actionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

export const api = new ApiClient();
