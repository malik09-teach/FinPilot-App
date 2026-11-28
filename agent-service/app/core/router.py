import json
import re
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, ValidationError

from app.config import Settings
from app.llm.base import LLMClient
from app.observability import RequestMetrics
from app.safety.redaction import redact_secrets

SpecialistName = Literal[
    "transaction",
    "goal_planning",
    "financial_analyst",
    "subscription",
    "budget",
    "fraud",
    "investment_researcher",
]

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

# Fast-path deterministic trivial queries (skip LLM completely when matched)
_TRIVIAL_BALANCE_RE = re.compile(
    r"^\s*(?:what(?:'s| is)\s+my\s+|check\s+(?:my\s+)?|show\s+(?:my\s+)?)?"
    r"(?:account\s+)?balance\??\s*$",
    re.IGNORECASE,
)

# High-precision keyword fast-paths to avoid an extra router LLM call
_FAST_RULES: list[tuple[re.Pattern[str], SpecialistName]] = [
    (re.compile(r"\b(?:send|transfer|pay|wire|bhejo|bhej)\b", re.IGNORECASE), "transaction"),
    (re.compile(r"\b(?:fraud|suspicious|unusual|freeze\s+card|hacked|scam)\b", re.IGNORECASE), "fraud"),
    (re.compile(r"\b(?:subscription|subscriptions|recurring|netflix|spotify)\b", re.IGNORECASE), "subscription"),
    (re.compile(r"\b(?:save|saving|savings|goal|emergency\s+fund)\b", re.IGNORECASE), "goal_planning"),
    (re.compile(r"\b(?:budget|spending\s+limit|over\s+budget)\b", re.IGNORECASE), "budget"),
    (re.compile(r"\b(?:invest|investment|market|btc|bitcoin|gold|crude\s+oil|silver|crypto|commodity)\b", re.IGNORECASE), "investment_researcher"),
]


class RouteDecision(BaseModel):
    specialist: SpecialistName
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    reason: str = Field(default="", max_length=300)
    fast_path: bool = False
    trivial_balance: bool = False


def is_trivial_balance_query(message: str) -> bool:
    return bool(_TRIVIAL_BALANCE_RE.match(message.strip()))


async def route_intent(
    *,
    message: str,
    llm: LLMClient,
    settings: Settings,
    metrics: RequestMetrics,
) -> RouteDecision:
    """Route user message via fast-path rules or router-model JSON classifier."""
    if is_trivial_balance_query(message):
        return RouteDecision(
            specialist="financial_analyst",
            confidence=1.0,
            reason="Trivial balance lookup fast-path",
            fast_path=True,
            trivial_balance=True,
        )

    for pattern, specialist in _FAST_RULES:
        if pattern.search(message):
            return RouteDecision(
                specialist=specialist,
                confidence=0.95,
                reason="Fast-path keyword rule",
                fast_path=True,
            )

    router_prompt = (_PROMPTS_DIR / "router.md").read_text(encoding="utf-8").strip()
    model = settings.groq_model_router or settings.groq_model_agent or "fake-router"
    messages = [
        {"role": "system", "content": router_prompt},
        {"role": "user", "content": redact_secrets(message)},
    ]

    for attempt in range(2):
        resp = await llm.chat(
            model=model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=160,
        )
        metrics.add_usage(resp.usage.prompt_tokens, resp.usage.completion_tokens)
        try:
            raw = json.loads(resp.content)
            decision = RouteDecision.model_validate(raw)
            return decision
        except (json.JSONDecodeError, ValidationError):
            if attempt == 0:
                messages.append({"role": "assistant", "content": resp.content})
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            "Invalid JSON or specialist. Return ONLY valid JSON with keys "
                            '"specialist", "confidence", "reason".'
                        ),
                    }
                )
                continue

    return RouteDecision(
        specialist="financial_analyst",
        confidence=0.5,
        reason="Fallback after invalid router output",
    )
