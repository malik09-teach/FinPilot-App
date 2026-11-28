"""FastAPI router for the Investment Researcher feature.

Endpoints:
  GET  /v1/market          – live prices for BTC, Gold, Crude Oil, Silver
  POST /v1/market/advise   – budget-aware allocation advice
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.agents.investment_researcher import fetch_market_data, _build_market_summary, _build_advice
from app.security import verify_service_token

router = APIRouter(prefix="/v1/market", tags=["investment_researcher"])


class AdviseRequest(BaseModel):
    budget: float = Field(..., gt=0, description="User's investment budget in PKR")


@router.get("")
async def get_market_prices(
    request: Request,
    _service_token: str = Depends(verify_service_token),
) -> dict:
    """Return current market prices for BTC, Gold, Crude Oil, and Silver."""
    settings = request.app.state.settings
    market = await fetch_market_data(settings)
    return {
        "status": "ok",
        "data": market,
        "summary": _build_market_summary(market),
    }


@router.post("/advise")
async def get_investment_advice(
    body: AdviseRequest,
    request: Request,
    _service_token: str = Depends(verify_service_token),
) -> dict:
    """Return budget-aware investment allocation for the four supported assets."""
    settings = request.app.state.settings
    market = await fetch_market_data(settings)
    advice = _build_advice(market, body.budget)
    return {
        "status": "ok",
        "budget_pkr": body.budget,
        "market": market,
        "advice": advice,
    }
