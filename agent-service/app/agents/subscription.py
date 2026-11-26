from app.agents.base import BaseSpecialistAgent


class SubscriptionAgent(BaseSpecialistAgent):
    name = "subscription"
    prompt_file = "subscription.md"
    allowed_tools = frozenset(
        {
            "get_recurring_transactions",
            "get_transactions",
        }
    )
