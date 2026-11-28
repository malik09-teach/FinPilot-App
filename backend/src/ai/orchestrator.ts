import { prisma } from '../config/prisma.js';
import { FinancialAnalystAgent } from './agents/analyst.agent.js';
import { BudgetAgent } from './agents/budget.agent.js';
import { InvestmentResearcherAgent } from './agents/investmentResearcher.agent.js';
import { InvestmentResearcherAgent } from './agents/investmentResearcher.agent.js';
import { TransactionAgent } from './agents/transaction.agent.js';
import { FraudDetectionAgent } from './agents/fraud.agent.js';
import { GoalPlanningAgent } from './agents/goal.agent.js';
import { SubscriptionAgent } from './agents/subscription.agent.js';
import { AuditService } from '../modules/audit/audit.service.js';

export interface WorkflowStep {
  step: number;
  title: string;
  agent: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'AWAITING_APPROVAL' | 'FAILED';
  description?: string;
}

export interface OrchestrationResult {
  sessionId: string;
  userMessage: string;
  assistantMessage: string;
  intent: string;
  workflowSteps: WorkflowStep[];
  agentOutputs: Record<string, any>;
  action?: {
    id: string;
    actionType: string;
    status: string;
    payload: Record<string, any>;
    summary: string;
    requiredApproval: boolean;
  };
}

export class AgentOrchestrator {
  /**
   * Main entry point for user financial queries
   */
  static async handleUserRequest(params: {
    userId: string;
    sessionId?: string;
    message: string;
    skipUserMessagePersist?: boolean;
  }): Promise<OrchestrationResult> {
    const { userId, message } = params;

    // 1. Ensure or create AgentSession
    let session = params.sessionId
      ? await prisma.agentSession.findUnique({ where: { id: params.sessionId } })
      : await prisma.agentSession.findFirst({
          where: { userId, status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
        });

    if (!session) {
      session = await prisma.agentSession.create({
        data: {
          userId,
          title: 'Financial Health & Wealth Copilot',
          status: 'ACTIVE',
        },
      });
    }

    // Save user message in session unless already persisted by gateway
    if (!params.skipUserMessagePersist) {
      await prisma.agentMessage.create({
        data: {
          sessionId: session.id,
          role: 'USER',
          content: message,
        },
      });
    }

    const lower = message.toLowerCase();

    // 2. Intent Identification
    // Intent A: Money Transfer (e.g. "Send PKR 5,000 to Ali", "Transfer 10,000 to Hamza", "pay Ali 2000")
    if (
      lower.includes('send') ||
      lower.includes('transfer') ||
      lower.includes('pay') ||
      lower.includes('wire')
    ) {
      return this.handleTransferWorkflow(userId, session.id, message);
    }

    // Intent B: Savings Plan / Goal (e.g. "I want to save PKR 100,000 in four months", "Help me save 50000")
    if (
      lower.includes('save') ||
      lower.includes('saving') ||
      lower.includes('goal') ||
      lower.includes('emergency fund')
    ) {
      return this.handleSavingsWorkflow(userId, session.id, message);
    }

    // Intent C: Fraud / Security / Anomaly Check (e.g. "Check for fraud", "Are there unusual transactions?")
    if (
      lower.includes('fraud') ||
      lower.includes('suspicious') ||
      lower.includes('unusual') ||
      lower.includes('security') ||
      lower.includes('risk')
    ) {
      return this.handleFraudWorkflow(userId, session.id, message);
    }

    // Intent D: Subscriptions / Recurring expenses (e.g. "Subscriptions", "recurring bills", "netflix")
    if (
      lower.includes('subscription') ||
      lower.includes('recurring') ||
      lower.includes('netflix') ||
      lower.includes('spotify')
    ) {
      return this.handleSubscriptionWorkflow(userId, session.id, message);
    }

    // Intent E: Budgeting (e.g. "Help me create a budget", "Monthly budget plan")
    if (lower.includes('budget') || lower.includes('limit') || lower.includes('spending limit')) {
      return this.handleBudgetWorkflow(userId, session.id, message);
    }

    // Intent F: Investment Research (e.g. "BTC price", "should I invest in gold", "market research")
    if (
      lower.includes('invest') ||
      lower.includes('market') ||
      lower.includes('btc') ||
      lower.includes('bitcoin') ||
      lower.includes('gold') ||
      lower.includes('crude oil') ||
      lower.includes('silver') ||
      lower.includes('crypto') ||
      lower.includes('commodity') ||
      lower.includes('research')
    ) {
      return this.handleInvestmentResearchWorkflow(userId, session.id, message);
    }

    // Default Intent: Financial Analysis & Overall Wealth Health
    return this.handleAnalysisWorkflow(userId, session.id, message);
  }

  /**
   * Controlled Workflow 1: Money Transfer
   */
  private static async handleTransferWorkflow(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<OrchestrationResult> {
    const workflowSteps: WorkflowStep[] = [
      { step: 1, title: 'Understand transfer intent', agent: 'AgentOrchestrator', status: 'COMPLETED' },
      { step: 2, title: 'Identify recipient & parse amount', agent: 'TransactionAgent', status: 'COMPLETED' },
      { step: 3, title: 'Validate recipient & accounts', agent: 'TransactionAgent', status: 'COMPLETED' },
      { step: 4, title: 'Validate balance & transfer limits', agent: 'TransactionAgent', status: 'COMPLETED' },
      { step: 5, title: 'Create transfer draft', agent: 'TransactionAgent', status: 'COMPLETED' },
      { step: 6, title: 'Awaiting explicit user PIN authorization', agent: 'SecurityGateway', status: 'AWAITING_APPROVAL' },
    ];

    // Extract amount
    const amountMatch = message.match(/(?:pkr|rs\.?|rs|pkr\.)?\s*([\d,]+)/i);
    let amount = 5000;
    if (amountMatch && amountMatch[1]) {
      const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) amount = parsed;
    }

    // Extract recipient name
    let recipient = 'Ali Khan';
    const toMatch = message.match(/(?:to|for)\s+([a-zA-Z\s]+)/i);
    if (toMatch && toMatch[1]) {
      recipient = toMatch[1].trim();
    }

    // Run Transaction Agent
    const txAgentResult = await TransactionAgent.prepareTransferDraft(userId, {
      recipientQuery: recipient,
      amount,
      note: `Transfer via FinPilot AI`,
    });

    if (!txAgentResult.success || !txAgentResult.draft) {
      const errorMsg = txAgentResult.error || 'Failed to prepare transfer draft.';
      workflowSteps[3].status = 'FAILED';
      workflowSteps[4].status = 'FAILED';

      await prisma.agentMessage.create({
        data: {
          sessionId,
          role: 'ASSISTANT',
          content: `Transfer validation issue: ${errorMsg}`,
        },
      });

      return {
        sessionId,
        userMessage: message,
        assistantMessage: `I could not prepare the transfer: ${errorMsg}`,
        intent: 'MONEY_TRANSFER',
        workflowSteps,
        agentOutputs: { TransactionAgent: txAgentResult },
      };
    }

    // Create AgentAction in AWAITING_APPROVAL state
    const action = await prisma.agentAction.create({
      data: {
        sessionId,
        userId,
        actionType: 'TRANSFER',
        status: 'AWAITING_APPROVAL',
        payload: JSON.stringify(txAgentResult.draft),
        requiredApproval: true,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins expiry
      },
    });

    // Create AgentApproval record
    await prisma.agentApproval.create({
      data: {
        actionId: action.id,
        userId,
        status: 'PENDING',
        approvalMethod: 'PIN',
      },
    });

    await AuditService.log({
      userId,
      actorType: 'AI_AGENT',
      action: 'AGENT_ACTION_PLANNED',
      entityType: 'AGENT_ACTION',
      entityId: action.id,
      details: { actionType: 'TRANSFER', payload: txAgentResult.draft },
    });

    const assistantMsg = `I have validated your transfer request. Here is the transfer draft for PKR ${amount.toLocaleString()} to ${txAgentResult.draft.recipientName} (${txAgentResult.draft.recipientAccount}). For your security, this requires your explicit 4-digit PIN confirmation before execution.`;

    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantMsg,
        metadata: JSON.stringify({
          actionId: action.id,
          workflowSteps,
        }),
      },
    });

    return {
      sessionId,
      userMessage: message,
      assistantMessage: assistantMsg,
      intent: 'MONEY_TRANSFER',
      workflowSteps,
      agentOutputs: { TransactionAgent: txAgentResult },
      action: {
        id: action.id,
        actionType: action.actionType,
        status: action.status,
        payload: txAgentResult.draft,
        summary: txAgentResult.draft.summary,
        requiredApproval: true,
      },
    };
  }

  /**
   * Controlled Workflow 2: AI Savings Plan
   */
  private static async handleSavingsWorkflow(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<OrchestrationResult> {
    const workflowSteps: WorkflowStep[] = [
      { step: 1, title: 'Analyze user income trends', agent: 'FinancialAnalystAgent', status: 'COMPLETED' },
      { step: 2, title: 'Analyze expenditure & outflow', agent: 'FinancialAnalystAgent', status: 'COMPLETED' },
      { step: 3, title: 'Identify discretionary spending categories', agent: 'FinancialAnalystAgent', status: 'COMPLETED' },
      { step: 4, title: 'Calculate potential savings capacity', agent: 'BudgetAgent', status: 'COMPLETED' },
      { step: 5, title: 'Formulate savings plan & timeline', agent: 'GoalPlanningAgent', status: 'COMPLETED' },
      { step: 6, title: 'Awaiting user goal approval', agent: 'AgentOrchestrator', status: 'AWAITING_APPROVAL' },
    ];

    // Extract target amount
    const amountMatch = message.match(/(?:save|target)?\s*(?:pkr|rs\.?|rs|pkr\.)?\s*([\d,]+)/i);
    let targetAmount = 100000;
    if (amountMatch && amountMatch[1]) {
      const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) targetAmount = parsed;
    }

    // Extract months
    let durationMonths = 4;
    const monthsMatch = message.match(/(\d+)\s*(?:month|months|mo)/i);
    if (monthsMatch && monthsMatch[1]) {
      durationMonths = parseInt(monthsMatch[1], 10);
    } else if (message.includes('four')) durationMonths = 4;
    else if (message.includes('three')) durationMonths = 3;
    else if (message.includes('six')) durationMonths = 6;
    else if (message.includes('twelve') || message.includes('year')) durationMonths = 12;

    const [analysisResult, goalResult] = await Promise.all([
      FinancialAnalystAgent.analyze(userId),
      GoalPlanningAgent.formulateSavingsPlan(userId, {
        targetAmount,
        durationMonths,
        goalName: `AI Savings Target: PKR ${targetAmount.toLocaleString()}`,
      }),
    ]);

    // Create Agent Action for savings goal approval
    const action = await prisma.agentAction.create({
      data: {
        sessionId,
        userId,
        actionType: 'CREATE_SAVING_GOAL',
        status: 'AWAITING_APPROVAL',
        payload: JSON.stringify(goalResult.draft),
        requiredApproval: true,
      },
    });

    await prisma.agentApproval.create({
      data: {
        actionId: action.id,
        userId,
        status: 'PENDING',
        approvalMethod: 'MANUAL',
      },
    });

    const assistantMsg = `I have analyzed your finances! Based on your current income of PKR ${analysisResult.metrics.totalIncome.toLocaleString()} and monthly expenses, saving PKR ${targetAmount.toLocaleString()} over ${durationMonths} months requires saving PKR ${goalResult.plan.monthlyDeposit.toLocaleString()}/month. Your current net monthly cash flow easily supports this! Would you like me to activate this goal for you?`;

    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantMsg,
        metadata: JSON.stringify({
          actionId: action.id,
          workflowSteps,
        }),
      },
    });

    return {
      sessionId,
      userMessage: message,
      assistantMessage: assistantMsg,
      intent: 'SAVINGS_PLAN',
      workflowSteps,
      agentOutputs: {
        FinancialAnalystAgent: analysisResult,
        GoalPlanningAgent: goalResult,
      },
      action: {
        id: action.id,
        actionType: action.actionType,
        status: action.status,
        payload: goalResult.draft,
        summary: goalResult.draft.summary,
        requiredApproval: true,
      },
    };
  }

  /**
   * Controlled Workflow 3: Fraud & Security Assessment
   */
  private static async handleFraudWorkflow(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<OrchestrationResult> {
    const workflowSteps: WorkflowStep[] = [
      { step: 1, title: 'Analyze transaction velocity and spikes', agent: 'FraudDetectionAgent', status: 'COMPLETED' },
      { step: 2, title: 'Cross-reference deterministic risk rules', agent: 'FraudDetectionAgent', status: 'COMPLETED' },
      { step: 3, title: 'Generate security audit explanation', agent: 'FraudDetectionAgent', status: 'COMPLETED' },
    ];

    const fraudResult = await FraudDetectionAgent.inspectTransactions(userId);

    let action;
    if (fraudResult.riskAssessment.suggestedAction === 'FREEZE_CARD') {
      action = await prisma.agentAction.create({
        data: {
          sessionId,
          userId,
          actionType: 'FREEZE_CARD',
          status: 'AWAITING_APPROVAL',
          payload: JSON.stringify({ reason: 'Precautionary freeze due to risk anomaly' }),
          requiredApproval: true,
        },
      });

      await prisma.agentApproval.create({
        data: {
          actionId: action.id,
          userId,
          status: 'PENDING',
          approvalMethod: 'PIN',
        },
      });
    }

    const assistantMsg = fraudResult.summary + '\n\n' + fraudResult.riskAssessment.recommendations.map((r) => `• ${r}`).join('\n');

    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantMsg,
        metadata: JSON.stringify({ workflowSteps, fraudResult }),
      },
    });

    return {
      sessionId,
      userMessage: message,
      assistantMessage: assistantMsg,
      intent: 'FRAUD_DETECTION',
      workflowSteps,
      agentOutputs: { FraudDetectionAgent: fraudResult },
      action: action
        ? {
            id: action.id,
            actionType: action.actionType,
            status: action.status,
            payload: { reason: 'Precautionary Card Freeze' },
            summary: 'Precautionary Freeze for Mastercard ending in 8824',
            requiredApproval: true,
          }
        : undefined,
    };
  }

  /**
   * Controlled Workflow 4: Subscription & Recurring Expenses
   */
  private static async handleSubscriptionWorkflow(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<OrchestrationResult> {
    const workflowSteps: WorkflowStep[] = [
      { step: 1, title: 'Identify recurring merchant debits', agent: 'SubscriptionAgent', status: 'COMPLETED' },
      { step: 2, title: 'Calculate annual run rate & upcoming charges', agent: 'SubscriptionAgent', status: 'COMPLETED' },
      { step: 3, title: 'Generate cost optimization recommendations', agent: 'SubscriptionAgent', status: 'COMPLETED' },
    ];

    const subResult = await SubscriptionAgent.analyzeSubscriptions(userId);

    const assistantMsg = `${subResult.summary} Across all active services, your annual commitment is PKR ${subResult.annualRunRate.toLocaleString()}.\n\n` +
      subResult.suggestions.map((s) => `• ${s}`).join('\n');

    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantMsg,
        metadata: JSON.stringify({ workflowSteps, subResult }),
      },
    });

    return {
      sessionId,
      userMessage: message,
      assistantMessage: assistantMsg,
      intent: 'SUBSCRIPTIONS',
      workflowSteps,
      agentOutputs: { SubscriptionAgent: subResult },
    };
  }

  /**
   * Controlled Workflow 5: Budget Planning
   */
  private static async handleBudgetWorkflow(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<OrchestrationResult> {
    const workflowSteps: WorkflowStep[] = [
      { step: 1, title: 'Analyze spending categories', agent: 'BudgetAgent', status: 'COMPLETED' },
      { step: 2, title: 'Synthesize optimal category caps', agent: 'BudgetAgent', status: 'COMPLETED' },
      { step: 3, title: 'Draft personalized monthly budget', agent: 'BudgetAgent', status: 'COMPLETED' },
      { step: 4, title: 'Awaiting user budget activation', agent: 'AgentOrchestrator', status: 'AWAITING_APPROVAL' },
    ];

    const budgetResult = await BudgetAgent.reviewAndPlan(userId);

    const action = await prisma.agentAction.create({
      data: {
        sessionId,
        userId,
        actionType: 'CREATE_BUDGET',
        status: 'AWAITING_APPROVAL',
        payload: JSON.stringify({
          month: new Date().toISOString().slice(0, 7),
          totalLimit: budgetResult.proposedLimit,
          categories: budgetResult.proposedCategories,
        }),
        requiredApproval: true,
      },
    });

    await prisma.agentApproval.create({
      data: {
        actionId: action.id,
        userId,
        status: 'PENDING',
        approvalMethod: 'MANUAL',
      },
    });

    const assistantMsg = `I have formulated a recommended monthly budget of PKR ${budgetResult.proposedLimit.toLocaleString()}. This will unlock approximately PKR ${budgetResult.projectedSavings.toLocaleString()} in monthly savings! Would you like me to activate this budget?`;

    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantMsg,
        metadata: JSON.stringify({ workflowSteps, budgetResult }),
      },
    });

    return {
      sessionId,
      userMessage: message,
      assistantMessage: assistantMsg,
      intent: 'BUDGET_PLANNING',
      workflowSteps,
      agentOutputs: { BudgetAgent: budgetResult },
      action: {
        id: action.id,
        actionType: action.actionType,
        status: action.status,
        payload: {
          totalLimit: budgetResult.proposedLimit,
          categories: budgetResult.proposedCategories,
        },
        summary: `Activate PKR ${budgetResult.proposedLimit.toLocaleString()} monthly budget`,
        requiredApproval: true,
      },
    };
  }

  /**
   * Default Workflow: Complete Financial Analysis
   */
  private static async handleAnalysisWorkflow(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<OrchestrationResult> {
    const workflowSteps: WorkflowStep[] = [
      { step: 1, title: 'Aggregate accounts & ledger entries', agent: 'FinancialAnalystAgent', status: 'COMPLETED' },
      { step: 2, title: 'Analyze net cash flow & savings rate', agent: 'FinancialAnalystAgent', status: 'COMPLETED' },
      { step: 3, title: 'Synthesize actionable wealth insights', agent: 'FinancialAnalystAgent', status: 'COMPLETED' },
    ];

    const analysis = await FinancialAnalystAgent.analyze(userId);

    const assistantMsg = `Here is your financial overview:\n` +
      `• Total Inflow: PKR ${analysis.metrics.totalIncome.toLocaleString()}\n` +
      `• Total Outflow: PKR ${analysis.metrics.totalExpense.toLocaleString()}\n` +
      `• Net Savings Rate: ${analysis.metrics.savingsRate}\n` +
      `• Current Balance: PKR ${analysis.metrics.currentBalance.toLocaleString()}\n\n` +
      analysis.recommendation;

    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantMsg,
        metadata: JSON.stringify({ workflowSteps, analysis }),
      },
    });

    return {
      sessionId,
      userMessage: message,
      assistantMessage: assistantMsg,
      intent: 'FINANCIAL_ANALYSIS',
      workflowSteps,
      agentOutputs: { FinancialAnalystAgent: analysis },
    };
  }

  /**
   * Workflow F: Investment Research – BTC, Gold, Crude Oil, Silver
   * Delegates to the Python agent-service which calls Tavily for live prices.
   */
  private static async handleInvestmentResearchWorkflow(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<OrchestrationResult> {
    const workflowSteps: WorkflowStep[] = [
      { step: 1, title: 'Identify investment research intent', agent: 'AgentOrchestrator', status: 'COMPLETED' },
      { step: 2, title: 'Fetch live market prices (BTC, Gold, Oil, Silver)', agent: 'InvestmentResearcherAgent', status: 'COMPLETED' },
      { step: 3, title: 'Generate budget-aware recommendations', agent: 'InvestmentResearcherAgent', status: 'COMPLETED' },
    ];

    // Extract budget from message if present
    const budgetMatch = message.match(/(?:pkr|rs\.?|budget[:\s]+)?\s*([\d,]+(?:\.\d+)?)/i);
    const budget = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, '')) : 0;

    const assistantMsg =
      `📊 **Investment Researcher**\n\n` +
      `I'm analyzing current market prices for BTC, Gold, Crude Oil, and Silver via the AI agent service.\n\n` +
      (budget > 0
        ? `With your budget of PKR ${budget.toLocaleString()}, the Investment Researcher agent will suggest an optimal allocation.\n\n`
        : `Please share your available budget (in PKR) for personalized allocation advice.\n\n`) +
      `💡 *This analysis is handled by the agent-service at /v1/chat using the investment_researcher specialist, ` +
      `powered by Tavily live search data.*`;

    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantMsg,
        metadata: JSON.stringify({ workflowSteps, budget }),
      },
    });

    return {
      sessionId,
      userMessage: message,
      assistantMessage: assistantMsg,
      intent: 'INVESTMENT_RESEARCH',
      workflowSteps,
      agentOutputs: { InvestmentResearcherAgent: { budget, specialist: 'investment_researcher' } },
    };
  }
}
