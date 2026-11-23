import { toolRegistry } from '../tools/registry.js';

export class FinancialAnalystAgent {
  static readonly name = 'FinancialAnalystAgent';
  static readonly role = 'Financial Analyst Agent';

  static async analyze(userId: string) {
    const [analytics, income, expenses, balance] = await Promise.all([
      toolRegistry.get_spending_analytics.execute(userId, {}),
      toolRegistry.get_income_summary.execute(userId, {}),
      toolRegistry.get_expense_summary.execute(userId, {}),
      toolRegistry.get_account_balance.execute(userId, {}),
    ]);

    const savingsCapacity = Math.max(0, income.totalIncome - expenses.totalExpense);
    const savingsRatio = income.totalIncome > 0 ? (savingsCapacity / income.totalIncome) * 100 : 0;

    const insights: string[] = [];
    if (savingsRatio >= 40) {
      insights.push(`Healthy savings margin: You save ${savingsRatio.toFixed(0)}% of your monthly inflow.`);
    } else if (savingsRatio < 20) {
      insights.push(`High spending velocity: Discretionary expenses are consuming over 80% of net income.`);
    }

    const topCategory = analytics.categories?.[0];
    if (topCategory) {
      insights.push(`Primary expense driver is ${topCategory.category} at PKR ${topCategory.amount.toLocaleString()} (${topCategory.percentage}% of outflow).`);
    }

    return {
      agent: this.name,
      metrics: {
        totalIncome: income.totalIncome,
        totalExpense: expenses.totalExpense,
        netCashFlow: savingsCapacity,
        savingsRate: `${savingsRatio.toFixed(1)}%`,
        currentBalance: balance.balance,
      },
      insights,
      categoryBreakdown: expenses.categoryBreakdown,
      recommendation: savingsCapacity > 30000
        ? `You have a healthy surplus of PKR ${savingsCapacity.toLocaleString()}. You can comfortably allocate PKR 25,000 - 35,000 towards high-yield goals or debt clearance.`
        : `Consider capping non-essential spending in ${topCategory?.category || 'discretionary items'} to unlock additional savings.`,
    };
  }
}
