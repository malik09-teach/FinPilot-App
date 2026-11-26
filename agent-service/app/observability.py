import json
import logging
import time
from dataclasses import dataclass, field

from app.safety.redaction import redact_secrets

logger = logging.getLogger("finpilot.agent")


def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


@dataclass
class RequestMetrics:
    request_id: str
    session_id: str
    specialist: str = "unknown"
    start_time: float = field(default_factory=time.perf_counter)
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    tool_calls: int = 0
    cache_hits: int = 0

    def add_usage(self, prompt_tokens: int, completion_tokens: int) -> None:
        self.prompt_tokens += max(0, prompt_tokens)
        self.completion_tokens += max(0, completion_tokens)
        self.total_tokens = self.prompt_tokens + self.completion_tokens

    def estimated_cost_usd(self) -> float:
        # Conservative blended estimate ($0.20 / 1M input, $0.40 / 1M output)
        return round(
            (self.prompt_tokens * 0.20 + self.completion_tokens * 0.40) / 1_000_000,
            6,
        )

    def latency_ms(self) -> int:
        return int((time.perf_counter() - self.start_time) * 1000)


def log_event(event: str, request_id: str, **fields: object) -> None:
    safe_fields = {k: redact_secrets(str(v)) if isinstance(v, str) else v for k, v in fields.items()}
    payload = {"event": event, "request_id": request_id, **safe_fields}
    logger.info(json.dumps(payload, default=str))
