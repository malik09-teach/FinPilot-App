import asyncio
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from app.config import Settings
from app.core.errors import StepLimitError, TimeoutBudgetError, TokenBudgetError
from app.core.events import (
    SSEEvent,
    draft_created_event,
    token_event,
    tool_end_event,
    tool_start_event,
)
from app.core.memory import build_windowed_history
from app.llm.base import LLMClient, ToolCallRequest
from app.observability import RequestMetrics
from app.safety.redaction import redact_secrets
from app.security import ChatRequest
from app.tools.executor import ToolExecutor
from app.tools.manifest import ToolManifestStore

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

_TOOL_LABELS: dict[str, str] = {
    "get_account_balance": "Checking account balance...",
    "get_transactions": "Checking recent transactions...",
    "get_spending_analytics": "Analyzing spending...",
    "get_income_summary": "Reviewing income...",
    "get_expense_summary": "Reviewing expenses...",
    "get_budget_progress": "Checking budget progress...",
    "get_savings_goals": "Checking savings goals...",
    "get_recurring_transactions": "Checking recurring subscriptions...",
    "get_beneficiaries": "Looking up saved beneficiaries...",
    "get_fraud_risk_assessment": "Running fraud risk check...",
    "create_transfer_draft": "Preparing transfer draft...",
    "create_savings_goal_draft": "Drafting savings goal...",
    "create_budget_draft": "Drafting monthly budget...",
    "create_freeze_card_draft": "Preparing card freeze proposal...",
}


def load_prompt(filename: str) -> str:
    return (_PROMPTS_DIR / filename).read_text(encoding="utf-8").strip()


class BaseSpecialistAgent:
    """Shared tool-calling streaming loop for all 6 specialist agents."""

    name: str = "base"
    prompt_file: str = "financial_analyst.md"
    allowed_tools: frozenset[str] = frozenset()
    use_router_model: bool = False

    def __init__(
        self,
        *,
        llm: LLMClient,
        manifest: ToolManifestStore,
        executor: ToolExecutor,
        settings: Settings,
    ) -> None:
        self._llm = llm
        self._manifest = manifest
        self._executor = executor
        self._settings = settings

    def _model_name(self) -> str:
        if self.use_router_model and self._settings.groq_model_router:
            return self._settings.groq_model_router
        return self._settings.groq_model_agent or self._settings.groq_model_router or "fake-model"

    def _system_prompt(self) -> str:
        base = load_prompt("system_base.md")
        spec = load_prompt(self.prompt_file)
        return f"{base}\n\n{spec}"

    async def run_stream(
        self,
        *,
        request: ChatRequest,
        metrics: RequestMetrics,
        cache: dict[str, dict[str, Any]],
    ) -> AsyncIterator[SSEEvent]:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": self._system_prompt()},
            *build_windowed_history(
                history=request.history,
                running_summary=request.running_summary,
                window_size=self._settings.history_window_messages,
            ),
            {"role": "user", "content": redact_secrets(request.message)},
        ]

        tools = self._manifest.groq_tools_for_allowlist(self.allowed_tools)
        model = self._model_name()
        deadline = asyncio.get_running_loop().time() + self._settings.overall_timeout_seconds

        for _step in range(self._settings.max_tool_steps):
            if asyncio.get_running_loop().time() >= deadline:
                raise TimeoutBudgetError()
            if metrics.total_tokens >= self._settings.max_request_tokens:
                raise TokenBudgetError()

            pending_tool_calls: list[ToolCallRequest] = []
            buffered_tokens: list[str] = []

            async for chunk in self._llm.stream_chat(
                model=model,
                messages=messages,
                tools=tools or None,
            ):
                if chunk.usage:
                    metrics.add_usage(chunk.usage.prompt_tokens, chunk.usage.completion_tokens)
                if chunk.token:
                    buffered_tokens.append(chunk.token)
                    yield token_event(chunk.token)
                if chunk.tool_calls:
                    pending_tool_calls = chunk.tool_calls

            if not pending_tool_calls:
                return

            # Record assistant tool-call turn in message history
            messages.append(
                {
                    "role": "assistant",
                    "content": "".join(buffered_tokens) or None,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {"name": tc.name, "arguments": tc.arguments_json},
                        }
                        for tc in pending_tool_calls
                    ],
                }
            )

            for tc in pending_tool_calls:
                yield tool_start_event(tc.name, _TOOL_LABELS.get(tc.name, f"Running {tc.name}..."))

            outcomes = await self._executor.execute_batch(
                calls=[(tc.id, tc.name, tc.arguments_json) for tc in pending_tool_calls],
                allowlist=self.allowed_tools,
                context_token=request.context_token,
                request_id=request.request_id,
                cache=cache,
                metrics=metrics,
            )

            for outcome in outcomes:
                yield tool_end_event(outcome.tool_name, outcome.ok)
                if outcome.draft_action_id and outcome.draft_action_type:
                    yield draft_created_event(
                        action_id=outcome.draft_action_id,
                        action_type=outcome.draft_action_type,
                        summary=outcome.draft_summary or outcome.draft_action_type,
                    )
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": outcome.tool_call_id,
                        "name": outcome.tool_name,
                        "content": outcome.content_for_llm,
                    }
                )

        raise StepLimitError()
