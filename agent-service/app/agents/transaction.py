from app.agents.base import BaseSpecialistAgent


class TransactionAgent(BaseSpecialistAgent):
    name = "transaction"
    prompt_file = "transaction.md"
    allowed_tools = frozenset(
        {
            "get_account_balance",
            "get_beneficiaries",
            "create_transfer_draft",
        }
    )
