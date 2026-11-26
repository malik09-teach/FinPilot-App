import sys
from pathlib import Path

import pytest

# Ensure `agent-service/` is on sys.path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from app.config import Settings  # noqa: E402
from app.tools.manifest import ToolManifestStore  # noqa: E402


@pytest.fixture
def test_settings() -> Settings:
    return Settings(
        APP_ENV="test",
        BACKEND_BASE_URL="http://backend.test",
        AGENT_SERVICE_TOKEN="test-service-token",
        GROQ_API_KEY="",
        GROQ_MODEL_ROUTER="router-test-model",
        GROQ_MODEL_AGENT="agent-test-model",
        MAX_TOOL_STEPS=6,
        MAX_REQUEST_TOKENS=4096,
        PER_TOOL_TIMEOUT_SECONDS=5.0,
        OVERALL_TIMEOUT_SECONDS=15.0,
        MAX_CONCURRENT_GLOBAL=16,
        MAX_CONCURRENT_PER_USER=2,
    )


@pytest.fixture
def sample_raw_manifest() -> list[dict[str, object]]:
    return [
        {
            "name": "get_account_balance",
            "description": "Retrieve current and available balance",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_transactions",
            "description": "Retrieve recent transactions",
            "risk": "READ",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string"},
                    "limit": {"type": "number"},
                },
            },
        },
        {
            "name": "get_spending_analytics",
            "description": "Retrieve spending analytics",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_income_summary",
            "description": "Retrieve income summary",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_expense_summary",
            "description": "Retrieve expense summary",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_budget_progress",
            "description": "Retrieve budget progress",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_savings_goals",
            "description": "Retrieve savings goals",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_recurring_transactions",
            "description": "Retrieve recurring subscriptions",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_beneficiaries",
            "description": "Retrieve saved beneficiaries",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_fraud_risk_assessment",
            "description": "Assess fraud risk on recent transactions",
            "risk": "READ",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "create_transfer_draft",
            "description": "Create transfer draft",
            "risk": "DRAFT",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipientName": {"type": "string"},
                    "recipientAccount": {"type": "string"},
                    "amount": {"type": "number"},
                    "note": {"type": "string"},
                },
                "required": ["recipientName", "recipientAccount", "amount"],
            },
        },
        {
            "name": "create_savings_goal_draft",
            "description": "Create savings goal draft",
            "risk": "DRAFT",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "targetAmount": {"type": "number"},
                    "durationMonths": {"type": "number"},
                },
                "required": ["name", "targetAmount", "durationMonths"],
            },
        },
        {
            "name": "create_budget_draft",
            "description": "Create budget draft",
            "risk": "DRAFT",
            "parameters": {
                "type": "object",
                "properties": {
                    "totalLimit": {"type": "number"},
                    "categories": {"type": "array"},
                },
                "required": ["totalLimit", "categories"],
            },
        },
        {
            "name": "create_freeze_card_draft",
            "description": "Create card freeze draft",
            "risk": "DRAFT",
            "parameters": {
                "type": "object",
                "properties": {"reason": {"type": "string"}},
            },
        },
        # Even if backend accidentally sent a RESTRICTED tool, Python must drop it
        {
            "name": "execute_approved_transfer",
            "description": "Restricted",
            "risk": "RESTRICTED",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "freeze_card",
            "description": "Restricted",
            "risk": "RESTRICTED",
            "parameters": {"type": "object", "properties": {}},
        },
    ]


@pytest.fixture
def manifest_store(sample_raw_manifest: list[dict[str, object]]) -> ToolManifestStore:
    return ToolManifestStore(sample_raw_manifest)
