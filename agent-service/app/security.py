import hmac
from typing import Literal

from fastapi import Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.config import Settings, get_settings


class HistoryMessage(BaseModel):
    role: Literal["USER", "ASSISTANT", "SYSTEM"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    """Inbound chat payload from the TypeScript backend gateway."""

    session_id: str = Field(min_length=1, max_length=128)
    request_id: str = Field(min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=4000)
    history: list[HistoryMessage] = Field(default_factory=list)
    running_summary: str | None = Field(default=None, max_length=2000)
    context_token: str = Field(min_length=16, max_length=2048)
    user_id_hint: str | None = Field(
        default=None,
        description="Non-authoritative hint for concurrency bucketing only; backend enforces userId via context_token.",
    )


def verify_service_token(
    request: Request,
    x_service_token: str | None = Header(default=None, alias="X-Service-Token"),
) -> str:
    """Validate X-Service-Token in constant time."""
    app_settings: Settings | None = getattr(request.app.state, "settings", None)
    settings = app_settings or get_settings()
    expected = settings.agent_service_token
    if not x_service_token or not expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing service token",
        )
    if not hmac.compare_digest(x_service_token.encode("utf-8"), expected.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service token",
        )
    return x_service_token
