from app.agents.base import BaseSpecialistAgent


class BudgetAgent(BaseSpecialistAgent):
    name = "budget"
    prompt_file = "budget.md"
    allowed_tools = frozenset(
        {
            "get_budget_progress",
            "get_expense_summary",
            "get_spending_analytics",
            "create_budget_draft",
        }
    )
