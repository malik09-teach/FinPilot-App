from app.safety.redaction import redact_secrets
from app.security import HistoryMessage


def build_windowed_history(
    *,
    history: list[HistoryMessage],
    running_summary: str | None,
    window_size: int = 12,
) -> list[dict[str, str]]:
    """Convert backend-supplied session history into a bounded, redacted LLM message list."""
    messages: list[dict[str, str]] = []
    if running_summary and running_summary.strip():
        messages.append(
            {
                "role": "system",
                "content": f"Conversation summary so far: {redact_secrets(running_summary.strip())}",
            }
        )

    tail = history[-window_size:] if window_size > 0 else history
    for msg in tail:
        role = "user" if msg.role == "USER" else "assistant"
        messages.append({"role": role, "content": redact_secrets(msg.content)})
    return messages
