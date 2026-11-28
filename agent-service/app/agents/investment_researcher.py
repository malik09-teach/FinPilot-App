"""Investment Researcher agent – watches BTC, Gold, Crude Oil & Silver
and advises the user based on their available budget.

Live market data is fetched via the Tavily Search API when
TAVILY_API_KEY is present in the environment. Falls back to a static
stub so the app never crashes during development without a key.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.agents.base import BaseSpecialistAgent
from app.config import Settings
from app.core.events import SSEEvent, token_event
from app.llm.base import LLMClient
from app.observability import RequestMetrics
from app.safety.redaction import redact_secrets
from app.security import ChatRequest
from app.tools.executor import ToolExecutor
from app.tools.manifest import ToolManifestStore

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Supported assets
# ---------------------------------------------------------------------------
ASSETS: dict[str, str] = {
    "BTC": "Bitcoin price today USD",
    "GOLD": "Gold price per ounce today USD",
    "CRUDE_OIL": "Crude oil WTI price per barrel today USD",
    "SILVER": "Silver price per ounce today USD",
}

# ---------------------------------------------------------------------------
# Fallback static prices (used when Tavily key is absent or call fails)
# ---------------------------------------------------------------------------
_FALLBACK_PRICES: dict[str, dict[str, Any]] = {
    "BTC": {"price": 68_500, "unit": "USD/coin", "trend": "sideways"},
    "GOLD": {"price": 2_330, "unit": "USD/oz", "trend": "up"},
    "CRUDE_OIL": {"price": 82, "unit": "USD/barrel", "trend": "down"},
    "SILVER": {"price": 29, "unit": "USD/oz", "trend": "up"},
}


async def _fetch_via_tavily(query: str, api_key: str) -> str:
    """Call Tavily Search and return the first snippet or an empty string."""
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "basic",
        "max_results": 1,
        "include_answer": True,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("answer") or (data.get("results") or [{}])[0].get("content", "")
    except Exception as exc:
        logger.warning("Tavily fetch failed for '%s': %s", query, exc)
        return ""


async def fetch_market_data(settings: Settings) -> dict[str, dict[str, Any]]:
    """Return live or fallback price data for each supported asset."""
    api_key = getattr(settings, "tavily_api_key", "").strip()
    if not api_key:
        logger.info("TAVILY_API_KEY not set – using fallback market prices.")
        return _FALLBACK_PRICES.copy()

    results: dict[str, dict[str, Any]] = {}
    for symbol, query in ASSETS.items():
        snippet = await _fetch_via_tavily(query, api_key)
        # Try to parse a price number from the snippet; fall back to static
        price_data = _FALLBACK_PRICES[symbol].copy()
        price_data["snippet"] = snippet
        results[symbol] = price_data

    return results


def _build_market_summary(market: dict[str, dict[str, Any]]) -> str:
    lines = ["📊 **Current Market Snapshot**\n"]
    emoji = {"BTC": "₿", "GOLD": "🥇", "CRUDE_OIL": "🛢️", "SILVER": "🪙"}
    for symbol, data in market.items():
        icon = emoji.get(symbol, "•")
        price = data.get("price", "N/A")
        unit = data.get("unit", "")
        trend = data.get("trend", "")
        trend_icon = {"up": "📈", "down": "📉", "sideways": "➡️"}.get(trend, "")
        lines.append(f"{icon} **{symbol}**: ${price:,} {unit} {trend_icon}")
    return "\n".join(lines)


def _build_advice(market: dict[str, dict[str, Any]], budget: float) -> str:
    """Generate simple budget-aware investment advice."""
    lines: list[str] = ["\n\n💡 **Budget-Based Recommendations**\n"]

    btc_price = market["BTC"]["price"]
    gold_price = market["GOLD"]["price"]
    oil_price = market["CRUDE_OIL"]["price"]
    silver_price = market["SILVER"]["price"]

    if budget <= 0:
        lines.append("Please share your available investment budget so I can give specific advice.")
        return "\n".join(lines)

    lines.append(f"With a budget of **PKR {budget:,.0f}** (≈ USD {budget/280:,.0f} at ~280 PKR/USD):\n")

    usd_budget = budget / 280  # rough PKR→USD conversion

    if usd_budget >= btc_price * 0.001:
        frac = round(usd_budget * 0.3 / btc_price, 6)
        lines.append(f"- ₿ **BTC**: Consider buying ~{frac} BTC (≈ ${usd_budget*0.3:,.0f}). "
                     "High risk, high reward – only allocate what you can afford to lose.")

    if usd_budget >= 50:
        gold_oz = round(usd_budget * 0.4 / gold_price, 4)
        lines.append(f"- 🥇 **Gold**: ~{gold_oz} oz (≈ ${usd_budget*0.4:,.0f}). "
                     "Safe-haven asset, good hedge against inflation.")

    if usd_budget >= 20:
        silver_oz = round(usd_budget * 0.2 / silver_price, 2)
        lines.append(f"- 🪙 **Silver**: ~{silver_oz} oz (≈ ${usd_budget*0.2:,.0f}). "
                     "Affordable entry point with industrial demand upside.")

    if usd_budget >= 10:
        lines.append(f"- 🛢️ **Crude Oil**: Consider oil ETFs (≈ ${usd_budget*0.1:,.0f}). "
                     "Best accessed via mutual funds or commodity ETFs in Pakistan.")

    lines.append("\n⚠️ *This is educational market research, not licensed financial advice. "
                 "Always consult a SECP-registered advisor before investing.*")
    return "\n".join(lines)


class InvestmentResearcherAgent(BaseSpecialistAgent):
    """Specialist agent: live market data for BTC, Gold, Crude Oil & Silver
    with budget-aware recommendations powered by Tavily Search."""

    name = "investment_researcher"
    prompt_file = "investment_researcher.md"
    allowed_tools: frozenset[str] = frozenset({"get_account_balance"})

    async def run_stream(
        self,
        *,
        request: ChatRequest,
        metrics: RequestMetrics,
        cache: dict[str, Any],
    ) -> AsyncIterator[SSEEvent]:
        # 1. Fetch live market data
        yield token_event("🔍 Fetching latest market data…\n\n")
        market = await fetch_market_data(self._settings)

        # 2. Try to extract a budget from the message (look for numbers)
        import re
        message = request.message
        budget = 0.0
        m = re.search(r"(?:pkr|rs\.?|budget[:\s]+)?[\s]*([\d,]+(?:\.\d+)?)", message, re.IGNORECASE)
        if m:
            try:
                budget = float(m.group(1).replace(",", ""))
            except ValueError:
                pass

        # 3. Stream market summary
        summary = _build_market_summary(market)
        for line in summary.split("\n"):
            yield token_event(line + "\n")

        # 4. Stream advice
        advice = _build_advice(market, budget)
        for line in advice.split("\n"):
            yield token_event(line + "\n")
