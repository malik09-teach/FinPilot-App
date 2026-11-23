import { toolRegistry } from '../tools/registry.js';

export class BudgetAgent {
  static readonly name = 'BudgetAgent';
  static readonly role = 'Budget Management Agent';

  static async reviewAndPlan(userId: string, targetSavings?: number) {
    const [currentBudget, expenses, income] = await Promise.all([
      toolRegistry.get_budget_progress.execute(userId, {}),
      toolRegistry.get_expense_summary.execute(userId, {}),
      toolRegistry.get_income_summary.execute(userId, {}),
    ]);

    const totalIncome = income.totalIncome || 250000;
    const baseExpenses = expenses.totalExpense || 44700;
    const targetSavingAmount = targetSavings || 30000;
    const recommendedBudgetLimit = Math.max(50000, totalIncome - targetSavingAmount);

    // Recommended category breakdown
    const proposedCategories = [
      { category: 'FOOD', allocatedAmount: Math.round(recommendedBudgetLimit * 0.30) },
      { category: 'BILLS', allocatedAmount: Math.round(recommendedBudgetLimit * 0.25) },
      { category: 'UTILITIES', allocatedAmount: Math.round(recommendedBudgetLimit * 0.20) },
      { category: 'ENTERTAINMENT', allocatedAmount: Math.round(recommendedBudgetLimit * 0.15) },
      { category: 'SHOPPING', allocatedAmount: Math.round(recommendedBudgetLimit * 0.10) },
    ];

    const alerts: string[] = [];
    if (currentBudget) {
      const utilization = (currentBudget.totalSpent / currentBudget.totalLimit) * 100;
      if (utilization >= 80) {
        alerts.push(`Budget alert: You have spent ${utilization.toFixed(0)}% of your monthly budget.`);
      }
    }

    return {
      agent: this.name,
      currentBudget,
      proposedLimit: recommendedBudgetLimit,
      projectedSavings: totalIncome - recommendedBudgetLimit,
      proposedCategories,
      alerts,
      draftTool: 'create_budget_draft',
    };
  }
}
