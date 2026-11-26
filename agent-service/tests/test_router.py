import json

import pytest

from app.config import Settings
from app.core.router import route_intent
from app.llm.base import LLMResponse, LLMUsage
from app.llm.fake_client import FakeLLMClient
from app.observability import RequestMetrics


@pytest.mark.asyncio
async def test_router_fast_paths(test_settings: Settings) -> None:
    llm = FakeLLMClient()
    metrics = RequestMetrics(request_id="req-1", session_id="sess-1")

    bal = await route_intent(
        message="What is my balance?", llm=llm, settings=test_settings, metrics=metrics
    )
    assert bal.trivial_balance is True
    assert bal.specialist == "financial_analyst"
    assert len(llm.calls) == 0

    tx = await route_intent(
        message="Send PKR 2,000 to Ali Khan", llm=llm, settings=test_settings, metrics=metrics
    )
    assert tx.specialist == "transaction"
    assert tx.fast_path is True

    fraud = await route_intent(
        message="Check for suspicious activity", llm=llm, settings=test_settings, metrics=metrics
    )
    assert fraud.specialist == "fraud"


@pytest.mark.asyncio
async def test_router_invalid_json_repair_and_fallback(test_settings: Settings) -> None:
    # First response is invalid JSON, second repairs it
    llm = FakeLLMClient(
        scripted_responses=[
            LLMResponse(content="not valid json", usage=LLMUsage(10, 5)),
            LLMResponse(
                content=json.dumps({"specialist": "budget", "confidence": 0.88, "reason": "ok"}),
                usage=LLMUsage(12, 8),
            ),
        ]
    )
    metrics = RequestMetrics(request_id="req-2", session_id="sess-1")
    decision = await route_intent(
        message="How am I doing this month?", llm=llm, settings=test_settings, metrics=metrics
    )
    assert decision.specialist == "budget"
    assert len(llm.calls) == 2

    # Both attempts invalid -> graceful fallback to financial_analyst
    llm_bad = FakeLLMClient(
        scripted_responses=[
            LLMResponse(content="bad-1", usage=LLMUsage(5, 5)),
            LLMResponse(content='{"specialist":"unknown_agent"}', usage=LLMUsage(5, 5)),
        ]
    )
    fallback = await route_intent(
        message="How am I doing this month?", llm=llm_bad, settings=test_settings, metrics=metrics
    )
    assert fallback.specialist == "financial_analyst"
