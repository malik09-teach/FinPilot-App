import { toolRegistry } from '../tools/registry.js';

export class SubscriptionAgent {
  static readonly name = 'SubscriptionAgent';
  static readonly role = 'Subscription & Recurring Cost Agent';

  static async analyzeSubscriptions(userId: string) {
    const data = await toolRegistry.get_recurring_transactions.execute(userId, {});
    const subscriptions = data.subscriptions || [];
    const totalMonthly = data.totalMonthlyCost || 0;
    const annualRunRate = totalMonthly * 12;

    const upcomingWithin7Days = subscriptions.filter((sub: any) => {
      const daysDiff = (new Date(sub.nextDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return daysDiff >= 0 && daysDiff <= 7;
    });

    const suggestions: string[] = [];
    if (subscriptions.length >= 3) {
      suggestions.push(`You have ${subscriptions.length} active recurring subscriptions costing PKR ${totalMonthly.toLocaleString()}/month (PKR ${annualRunRate.toLocaleString()}/year).`);
    }

    if (upcomingWithin7Days.length > 0) {
      upcomingWithin7Days.forEach((sub: any) => {
        suggestions.push(`Upcoming charge: ${sub.merchantName} (PKR ${sub.expectedAmount.toLocaleString()}) on ${new Date(sub.nextDate).toLocaleDateString()}.`);
      });
    }

    return {
      agent: this.name,
      subscriptions,
      totalMonthlyCost: totalMonthly,
      annualRunRate,
      upcomingCharges: upcomingWithin7Days,
      suggestions,
      summary: `Active recurring commitments total PKR ${totalMonthly.toLocaleString()} per month.`,
    };
  }
}
