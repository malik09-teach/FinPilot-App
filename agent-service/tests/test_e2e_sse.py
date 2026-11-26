import json

import httpx
import pytest
import respx

from app.config import Settings
from app.core.limits import ConcurrencyLimiter
from app.core.orchestrator import AgentOrchestrator
from app.llm.base import LLMResponse, LLMUsage, ToolCallRequest
from app.llm.fake_client import FakeLLMClient
from app.main import create_app
from app.tools.bank_client import BankClient
from app.tools.executor import ToolExecutor
from app.tools.manifest import ToolManifestStore


def _parse_sse(raw_body: str) -> list[tuple[str, dict[str, object]]]:
    events: list[tuple[str, dict[str, object]]] = []
    for block in raw_body.strip().split("\n\n"):
        lines = block.strip().splitlines()
        ev_name = ""
        ev_data: dict[str, object] = {}
        for line in lines:
            if line.startswith("event: "):
                ev_name = line[len("event: ") :].strip()
            elif line.startswith("data: "):
                ev_data = json.loads(line[len("data: ") :])
        if ev_name:
            events.append((ev_name, ev_data))
    return events


def _wire_app_state(
    *,
    settings: Settings,
    llm_client: FakeLLMClient,
    bank_client: BankClient,
    manifest_store: ToolManifestStore,
):
    app = create_app(
        settings=settings,
        llm_client=llm_client,
        bank_client=bank_client,
        manifest_store=manifest_store,
    )
    executor = ToolExecutor(
        bank_client=bank_client,
        manifest=manifest_store,
        per_tool_timeout_seconds=settings.per_tool_timeout_seconds,
    )
    app.state.settings = settings
    app.state.bank_client = bank_client
    app.state.manifest = manifest_store
    app.state.orchestrator = AgentOrchestrator(
        llm=llm_client,
        manifest=manifest_store,
        executor=executor,
        settings=settings,
        limiter=ConcurrencyLimiter(
            max_global=settings.max_concurrent_global,
            max_per_user=settings.max_concurrent_per_user,
        ),
    )
    return app


@pytest.mark.asyncio
async def test_health_exposes_no_secrets_or_models(
    test_settings: Settings, manifest_store: ToolManifestStore
) -> None:
    bank_client = BankClient(base_url="http://backend.test", service_token="test-service-token")
    app = _wire_app_state(
        settings=test_settings,
        llm_client=FakeLLMClient(),
        bank_client=bank_client,
        manifest_store=manifest_store,
    )
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "groq" not in json.dumps(body).lower()
        assert "model" not in json.dumps(body).lower()
    await bank_client.close()


@pytest.mark.asyncio
async def test_chat_rejects_missing_or_wrong_service_token(
    test_settings: Settings, manifest_store: ToolManifestStore
) -> None:
    bank_client = BankClient(base_url="http://backend.test", service_token="test-service-token")
    app = _wire_app_state(
        settings=test_settings,
        llm_client=FakeLLMClient(),
        bank_client=bank_client,
        manifest_store=manifest_store,
    )
    payload = {
        "session_id": "sess-1",
        "request_id": "req-1",
        "message": "What is my balance?",
        "context_token": "c" * 32,
    }
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        r1 = await client.post("/v1/chat", json=payload)
        assert r1.status_code == 401
        r2 = await client.post("/v1/chat", json=payload, headers={"X-Service-Token": "wrong"})
        assert r2.status_code == 401
    await bank_client.close()


@pytest.mark.asyncio
async def test_e2e_trivial_balance_sse_against_mocked_backend(
    test_settings: Settings, manifest_store: ToolManifestStore
) -> None:
    with respx.mock(base_url="http://backend.test") as mock:
        invoke_route = mock.post("/internal/ai/tools/get_account_balance/invoke").mock(
            return_value=httpx.Response(
                200,
                json={
                    "success": True,
                    "data": {
                        "accountNumber": "1002345678",
                        "balance": 145000,
                        "availableBalance": 145000,
                    },
                },
            )
        )
        bank_client = BankClient(
            base_url="http://backend.test", service_token="test-service-token"
        )
        app = _wire_app_state(
            settings=test_settings,
            llm_client=FakeLLMClient(),
            bank_client=bank_client,
            manifest_store=manifest_store,
        )
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://testserver"
        ) as client:
            resp = await client.post(
                "/v1/chat",
                headers={"X-Service-Token": "test-service-token"},
                json={
                    "session_id": "sess-1",
                    "request_id": "req-bal-1",
                    "message": "What is my balance?",
                    "context_token": "signed-context-token-value",
                },
            )
            assert resp.status_code == 200
            events = _parse_sse(resp.text)
            names = [e[0] for e in events]
            assert names == ["tool_start", "tool_end", "token", "done"]
            assert "145,000" in str(events[2][1]["text"])
            assert invoke_route.call_count == 1
            sent_headers = invoke_route.calls[0].request.headers
            assert sent_headers["x-agent-context"] == "signed-context-token-value"
        await bank_client.close()


@pytest.mark.asyncio
async def test_e2e_transfer_draft_sse_emits_draft_created(
    test_settings: Settings, manifest_store: ToolManifestStore
) -> None:
    llm = FakeLLMClient(
        scripted_responses=[
            LLMResponse(
                content="",
                tool_calls=[
                    ToolCallRequest(id="tc_b", name="get_beneficiaries", arguments_json="{}")
                ],
                usage=LLMUsage(30, 10),
            ),
            LLMResponse(
                content="",
                tool_calls=[
                    ToolCallRequest(
                        id="tc_d",
                        name="create_transfer_draft",
                        arguments_json=json.dumps(
                            {
                                "recipientName": "Ali Khan",
                                "recipientAccount": "1004892110",
                                "amount": 2000,
                            }
                        ),
                    )
                ],
                usage=LLMUsage(40, 15),
            ),
            LLMResponse(
                content="I have prepared a transfer draft for PKR 2,000 to Ali Khan. Please confirm with your PIN.",
                usage=LLMUsage(50, 20),
            ),
        ]
    )

    with respx.mock(base_url="http://backend.test") as mock:
        mock.post("/internal/ai/tools/get_beneficiaries/invoke").mock(
            return_value=httpx.Response(
                200,
                json={
                    "success": True,
                    "data": [{"name": "Ali Khan", "accountNumber": "1004892110"}],
                },
            )
        )
        mock.post("/internal/ai/tools/create_transfer_draft/invoke").mock(
            return_value=httpx.Response(
                200,
                json={
                    "success": True,
                    "data": {"draftType": "TRANSFER", "amount": 2000},
                    "action": {
                        "id": "act_123",
                        "actionType": "TRANSFER",
                        "summary": "Transfer PKR 2,000 to Ali Khan (1004892110)",
                    },
                },
            )
        )
        bank_client = BankClient(
            base_url="http://backend.test", service_token="test-service-token"
        )
        app = _wire_app_state(
            settings=test_settings,
            llm_client=llm,
            bank_client=bank_client,
            manifest_store=manifest_store,
        )
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://testserver"
        ) as client:
            resp = await client.post(
                "/v1/chat",
                headers={"X-Service-Token": "test-service-token"},
                json={
                    "session_id": "sess-1",
                    "request_id": "req-trf-1",
                    "message": "Send PKR 2,000 to Ali Khan",
                    "context_token": "signed-context-token-value",
                },
            )
            assert resp.status_code == 200
            events = _parse_sse(resp.text)
            draft_events = [d for name, d in events if name == "draft_created"]
            assert len(draft_events) == 1
            assert draft_events[0]["actionId"] == "act_123"
            assert events[-1][0] == "done"
        await bank_client.close()
