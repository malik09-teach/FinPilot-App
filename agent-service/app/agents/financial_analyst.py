from app.agents.base import BaseSpecialistAgent


class FinancialAnalystAgent(BaseSpecialistAgent):
    name = "financial_analyst"
    prompt_file = "financial_analyst.md"
    allowed_tools = frozenset(
        {
            "get_account_balance",
            "get_transactions",
            "get_spending_analytics",
            "get_income_summary",
            "get_expense_summary",
        }
    )
