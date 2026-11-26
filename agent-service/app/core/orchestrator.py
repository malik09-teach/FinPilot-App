import json
from collections.abc import AsyncIterator
from typing import Any

from app.agents.base import BaseSpecialistAgent
from app.agents.budget import BudgetAgent
from app.agents.financial_analyst import FinancialAnalystAgent
from app.agents.fraud import FraudAgent
from app.agents.goal_planning import GoalPlanningAgent
from app.agents.subscription import SubscriptionAgent
from app.agents.transaction import TransactionAgent
from app.config import Settings
from app.core.errors import AgentError, RateLimitedError
from app.core.events import (
    SSEEvent,
    done_event,
    error_event,
    token_event,
    tool_end_event,
    tool_start_event,
)
from app.core.limits import ConcurrencyLimiter
from app.core.router import SpecialistName, route_intent
from app.llm.base import LLMClient
from app.llm.retry import UpstreamRateLimitError, UpstreamUnavailableError
from app.observability import RequestMetrics, log_event
from app.security import ChatRequest
from app.tools.executor import ToolExecutor
from app.tools.manifest import ToolManifestStore


class AgentOrchestrator:
    """Stateless multi-agent orchestrator: route -> specialist -> SSE stream."""

    def __init__(
        self,
        *,
        llm: LLMClient,
        manifest: ToolManifestStore,
        executor: ToolExecutor,
        settings: Settings,
        limiter: ConcurrencyLimiter,
    ) -> None:
        self._llm = llm
        self._manifest = manifest
        self._executor = executor
        self._settings = settings
        self._limiter = limiter
        self._specialists: dict[SpecialistName, BaseSpecialistAgent] = {
            "transaction": TransactionAgent(
                llm=llm, manifest=manifest, executor=executor, settings=settings
            ),
            "goal_planning": GoalPlanningAgent(
                llm=llm, manifest=manifest, executor=executor, settings=settings
            ),
            "financial_analyst": FinancialAnalystAgent(
                llm=llm, manifest=manifest, executor=executor, settings=settings
            ),
            "subscription": SubscriptionAgent(
                llm=llm, manifest=manifest, executor=executor, settings=settings
            ),
            "budget": BudgetAgent(
                llm=llm, manifest=manifest, executor=executor, settings=settings
            ),
            "fraud": FraudAgent(
                llm=llm, manifest=manifest, executor=executor, settings=settings
            ),
        }

    async def stream_chat(self, request: ChatRequest) -> AsyncIterator[SSEEvent]:
        metrics = RequestMetrics(request_id=request.request_id, session_id=request.session_id)
        cache: dict[str, dict[str, Any]] = {}
        user_key = request.user_id_hint or request.session_id

        try:
            async with self._limiter.acquire(user_key):
                decision = await route_intent(
                    message=request.message,
                    llm=self._llm,
                    settings=self._settings,
                    metrics=metrics,
                )
                metrics.specialist = decision.specialist
                log_event(
                    "routed",
                    request.request_id,
                    specialist=decision.specialist,
                    fast_path=decision.fast_path,
                )

                if decision.trivial_balance:
                    async for ev in self._run_trivial_balance(request, metrics, cache):
                        yield ev
                else:
                    specialist = self._specialists[decision.specialist]
                    async for ev in specialist.run_stream(
                        request=request, metrics=metrics, cache=cache
                    ):
                        yield ev

        except RateLimitedError as exc:
            yield error_event(code=exc.code, message=exc.user_message)
        except UpstreamRateLimitError:
            yield error_event(
                code="RATE_LIMITED",
                message="FinPilot AI is busy right now. Please try again in a few seconds.",
            )
        except UpstreamUnavailableError:
            yield error_event(
                code="UPSTREAM_UNAVAILABLE",
                message="FinPilot AI is temporarily unavailable. Please try again.",
            )
        except AgentError as exc:
            yield error_event(code=exc.code, message=exc.user_message)
        except Exception:
            log_event("orchestrator_unhandled_error", request.request_id)
            yield error_event(
                code="INTERNAL_ERROR",
                message="Unable to complete your request right now. Please try again.",
            )
        finally:
            latency_ms = metrics.latency_ms()
            log_event(
                "request_completed",
                request.request_id,
                specialist=metrics.specialist,
                prompt_tokens=metrics.prompt_tokens,
                completion_tokens=metrics.completion_tokens,
                total_tokens=metrics.total_tokens,
                estimated_cost_usd=metrics.estimated_cost_usd(),
                tool_calls=metrics.tool_calls,
                cache_hits=metrics.cache_hits,
                latency_ms=latency_ms,
            )
            yield done_event(
                request_id=request.request_id,
                session_id=request.session_id,
                specialist=metrics.specialist,
                prompt_tokens=metrics.prompt_tokens,
                completion_tokens=metrics.completion_tokens,
                latency_ms=latency_ms,
            )

    async def _run_trivial_balance(
        self,
        request: ChatRequest,
        metrics: RequestMetrics,
        cache: dict[str, dict[str, Any]],
    ) -> AsyncIterator[SSEEvent]:
        """Skip LLM for trivial balance queries with a direct tool call + templated reply."""
        yield tool_start_event("get_account_balance", "Checking account balance...")
        outcomes = await self._executor.execute_batch(
            calls=[("fast_bal", "get_account_balance", "{}")],
            allowlist=frozenset({"get_account_balance"}),
            context_token=request.context_token,
            request_id=request.request_id,
            cache=cache,
            metrics=metrics,
        )
        outcome = outcomes[0]
        yield tool_end_event("get_account_balance", outcome.ok)
        if not outcome.ok:
            yield token_event("I could not retrieve your account balance right now.")
            return

        # Parse JSON inside <UNTRUSTED_TOOL_DATA> block
        raw_text = outcome.content_for_llm
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                bal = json.loads(raw_text[start : end + 1])
                amount = float(bal.get("balance", 0))
                available = float(bal.get("availableBalance", amount))
                acc_num = str(bal.get("accountNumber", ""))
                suffix = f" (Account {acc_num})" if acc_num else ""
                yield token_event(
                    f"Your current balance{suffix} is PKR {amount:,.0f} "
                    f"(Available: PKR {available:,.0f})."
                )
                return
            except Exception:
                pass
        yield token_event("Your account balance has been retrieved.")
