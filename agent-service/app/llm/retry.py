import asyncio
import random
from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")


class UpstreamRateLimitError(Exception):
    """Raised when upstream LLM returns 429 and retries are exhausted."""


class UpstreamUnavailableError(Exception):
    """Raised when upstream LLM fails with 5xx/timeout after retries."""


def compute_backoff_seconds(
    attempt: int,
    retry_after: float | None = None,
    base_delay: float = 0.5,
    max_delay: float = 16.0,
) -> float:
    """Honor Retry-After when present; otherwise exponential backoff with jitter."""
    if retry_after is not None and retry_after > 0:
        return min(retry_after, max_delay)
    exp = min(max_delay, base_delay * (2**attempt))
    jitter = random.uniform(0, exp * 0.25)
    return float(exp + jitter)


def _extract_status_and_retry_after(exc: Exception) -> tuple[int | None, float | None]:
    status_code = getattr(exc, "status_code", None)
    response = getattr(exc, "response", None)
    if status_code is None and response is not None:
        status_code = getattr(response, "status_code", None)

    retry_after: float | None = None
    headers = getattr(response, "headers", None) if response is not None else None
    if headers:
        raw = headers.get("retry-after") or headers.get("Retry-After")
        if raw is not None:
            try:
                retry_after = float(raw)
            except ValueError:
                retry_after = None
    return status_code, retry_after


async def with_retry(
    operation: Callable[[], Awaitable[T]],
    *,
    max_retries: int = 3,
    sleep_fn: Callable[[float], Awaitable[None]] = asyncio.sleep,
) -> T:
    """Retry transient 429 and 5xx errors up to max_retries."""
    last_exc: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            return await operation()
        except Exception as exc:
            last_exc = exc
            status_code, retry_after = _extract_status_and_retry_after(exc)
            is_retryable = status_code == 429 or (status_code is not None and status_code >= 500)
            if not is_retryable or attempt >= max_retries:
                if status_code == 429:
                    raise UpstreamRateLimitError("Rate limited by LLM provider") from exc
                if status_code is not None and status_code >= 500:
                    raise UpstreamUnavailableError("LLM provider temporarily unavailable") from exc
                raise
            delay = compute_backoff_seconds(attempt, retry_after=retry_after)
            await sleep_fn(delay)

    raise UpstreamUnavailableError("LLM request failed") from last_exc
