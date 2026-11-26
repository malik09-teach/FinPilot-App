from app.agents.base import BaseSpecialistAgent


class FraudAgent(BaseSpecialistAgent):
    name = "fraud"
    prompt_file = "fraud.md"
    allowed_tools = frozenset(
        {
            "get_fraud_risk_assessment",
            "get_transactions",
            "create_freeze_card_draft",
        }
    )
