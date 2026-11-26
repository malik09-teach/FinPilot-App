from types import SimpleNamespace

import pytest

from app.agents.financial_analyst import FinancialAnalystAgent
from app.config import Settings
from app.core.errors import RateLimitedError
from app.core.limits import ConcurrencyLimiter
from app.llm.base import LLMResponse, LLMUsage, ToolCallRequest
from app.llm.fake_client import FakeLLMClient
from app.llm.retry import UpstreamRateLimitError, with_retry
from app.observability import RequestMetrics
from app.security import ChatRequest
from app.tools.bank_client import BankClient
from app.tools.executor import ToolExecutor
from app.tools.manifest import ToolManifestStore


class FakeStatusError(Exception):
    def __init__(self, status_code: int, retry_after: str | None = None) -> None:
        super().__init__(f"HTTP {status_code}")
        self.status_code = status_code
        headers = {"Retry-After": retry_after} if retry_after else {}
        self.response = SimpleNamespace(status_code=status_code, headers=headers)


@pytest.mark.asyncio
async def test_retry_honors_retry_after_and_recovers() -> None:
    attempts = 0
    sleeps: list[float] = []

    async def fake_sleep(sec: float) -> None:
        sleeps.append(sec)

    async def op() -> str:
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise FakeStatusError(429, retry_after="1.5")
        return "ok"

    result = await with_retry(op, max_retries=3, sleep_fn=fake_sleep)
    assert result == "ok"
    assert sleeps == [1.5, 1.5]


@pytest.mark.asyncio
async def test_retry_exhausted_raises_rate_limit() -> None:
    async def fake_sleep(_: float) -> None:
        return None

    async def always_429() -> str:
        raise FakeStatusError(429)

    with pytest.raises(UpstreamRateLimitError):
        await with_retry(always_429, max_retries=2, sleep_fn=fake_sleep)


@pytest.mark.asyncio
async def test_step_cap_and_token_cap(
    test_settings: Settings, manifest_store: ToolManifestStore
) -> None:
    # Force max_tool_steps = 2 and loop tool calls
    capped_settings = test_settings.model_copy(update={"max_tool_steps": 2})
    loop_resp = LLMResponse(
        content="",
        tool_calls=[ToolCallRequest(id="tc_1", name="get_account_balance", arguments_json="{}")],
        usage=LLMUsage(100, 50),
    )
    llm = FakeLLMClient(scripted_responses=[loop_resp, loop_resp, loop_resp])
    bank_client = BankClient(base_url="http://backend.test", service_token="tok")
    executor = ToolExecutor(bank_client=bank_client, manifest=manifest_store)
    agent = FinancialAnalystAgent(
        llm=llm, manifest=manifest_store, executor=executor, settings=capped_settings
    )
    req = ChatRequest(
        session_id="s1",
        request_id="r1",
        message="Analyze everything",
        context_token="x" * 32,
    )
    metrics = RequestMetrics(request_id="r1", session_id="s1")

    with pytest.raises(Exception) as exc_info:
        async for _ in agent.run_stream(request=req, metrics=metrics, cache={}):
            pass
    assert "maximum number of tool steps" in str(exc_info.value).lower()
    await bank_client.close()


@pytest.mark.asyncio
async def test_concurrency_limiter_per_user() -> None:
    limiter = ConcurrencyLimiter(max_global=10, max_per_user=1)
    async with limiter.acquire("user-1"):
        with pytest.raises(RateLimitedError):
            async with limiter.acquire("user-1"):
                pass
