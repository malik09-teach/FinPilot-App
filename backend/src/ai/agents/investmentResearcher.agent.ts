// InvestmentResearcherAgent provides simple market overview recommendations based on limited assets.
// Currently supports BTC, Gold, Crude Oil, and Silver. Future integration with Tavily API will provide live data.

export class InvestmentResearcherAgent {
  /**
   * Handle a generic investment research request.
   * @param userId The ID of the user.
   * @param sessionId The current session.
   * @param message The user's query.
   * @returns A simple recommendation string.
   */
  static async handleRequest(userId: string, sessionId: string, message: string): Promise<string> {
    // Very naive parsing – look for known asset keywords.
    const assets = ['btc', 'gold', 'oil', 'silver'];
    const requested = assets.filter(a => message.toLowerCase().includes(a));

    if (requested.length === 0) {
      return 'Please specify which assets you are interested in (e.g., BTC, gold, oil, silver).';
    }

    // Placeholder static data. In future, replace with live fetch via Tavily API.
    const data: Record<string, string> = {
      btc: 'BTC is currently around $30,000 with a 2% daily change.',
      gold: 'Gold is $1,800 per ounce, stable today.',
      oil: 'Crude oil price is $85 per barrel, slight increase.',
      silver: 'Silver trades at $23 per ounce.',
    };

    const insights = requested.map(a => data[a]).join(' ');
    // Simple budgeting suggestion – echo back the request.
    return `Market overview: ${insights}`;
  }
}
