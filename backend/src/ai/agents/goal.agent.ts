import { toolRegistry } from '../tools/registry.js';

export class GoalPlanningAgent {
  static readonly name = 'GoalPlanningAgent';
  static readonly role = 'Savings & Goal Planning Agent';

  static async formulateSavingsPlan(
    userId: string,
    params: {
      targetAmount: number;
      durationMonths: number;
      goalName?: string;
    }
  ) {
    const [analytics, income, expenses] = await Promise.all([
      toolRegistry.get_spending_analytics.execute(userId, {}),
      toolRegistry.get_income_summary.execute(userId, {}),
      toolRegistry.get_expense_summary.execute(userId, {}),
    ]);

    const monthlySurplus = Math.max(0, income.totalIncome - expenses.totalExpense);
    const requiredMonthlyDeposit = Math.ceil(params.targetAmount / Math.max(1, params.durationMonths));

    const isFeasible = monthlySurplus >= requiredMonthlyDeposit;
    const surplusCoverage = requiredMonthlyDeposit > 0 ? (monthlySurplus / requiredMonthlyDeposit) * 100 : 100;

    const planSummary = `To save PKR ${params.targetAmount.toLocaleString()} in ${params.durationMonths} months, you will need to deposit PKR ${requiredMonthlyDeposit.toLocaleString()} per month.`;

    const draft = await toolRegistry.create_savings_goal_draft.execute(userId, {
      name: params.goalName || `Savings Target: PKR ${params.targetAmount.toLocaleString()}`,
      targetAmount: params.targetAmount,
      durationMonths: params.durationMonths,
      monthlyContribution: requiredMonthlyDeposit,
    });

    return {
      agent: this.name,
      plan: {
        targetAmount: params.targetAmount,
        durationMonths: params.durationMonths,
        monthlyDeposit: requiredMonthlyDeposit,
        currentMonthlySurplus: monthlySurplus,
        isFeasible,
        feasibilityScore: `${Math.min(100, surplusCoverage).toFixed(0)}%`,
        summary: planSummary,
      },
      draft,
      requiresApproval: true,
      actionType: 'CREATE_SAVING_GOAL',
    };
  }
}
