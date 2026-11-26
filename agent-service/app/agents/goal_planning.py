from app.agents.base import BaseSpecialistAgent


class GoalPlanningAgent(BaseSpecialistAgent):
    name = "goal_planning"
    prompt_file = "goal_planning.md"
    allowed_tools = frozenset(
        {
            "get_savings_goals",
            "get_spending_analytics",
            "get_account_balance",
            "create_savings_goal_draft",
        }
    )
