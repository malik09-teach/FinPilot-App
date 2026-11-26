import json
from typing import Any, Literal

from pydantic import BaseModel

EventType = Literal[
    "token",
    "tool_start",
    "tool_end",
    "draft_created",
    "error",
    "done",
]


class SSEEvent(BaseModel):
    event: EventType
    data: dict[str, Any]

    def encode(self) -> str:
        """Format as standard Server-Sent Event frame."""
        payload = json.dumps(self.data, ensure_ascii=False, default=str)
        return f"event: {self.event}\ndata: {payload}\n\n"


def token_event(text: str) -> SSEEvent:
    return SSEEvent(event="token", data={"text": text})


def tool_start_event(tool: str, label: str) -> SSEEvent:
    return SSEEvent(event="tool_start", data={"tool": tool, "label": label})


def tool_end_event(tool: str, ok: bool) -> SSEEvent:
    return SSEEvent(event="tool_end", data={"tool": tool, "ok": ok})


def draft_created_event(
    *, action_id: str, action_type: str, summary: str
) -> SSEEvent:
    return SSEEvent(
        event="draft_created",
        data={
            "actionId": action_id,
            "actionType": action_type,
            "summary": summary,
        },
    )


def error_event(*, code: str, message: str) -> SSEEvent:
    return SSEEvent(event="error", data={"code": code, "message": message})


def done_event(
    *,
    request_id: str,
    session_id: str,
    specialist: str,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: int,
) -> SSEEvent:
    return SSEEvent(
        event="done",
        data={
            "requestId": request_id,
            "sessionId": session_id,
            "specialist": specialist,
            "usage": {
                "promptTokens": prompt_tokens,
                "completionTokens": completion_tokens,
                "totalTokens": prompt_tokens + completion_tokens,
            },
            "latencyMs": latency_ms,
        },
    )
