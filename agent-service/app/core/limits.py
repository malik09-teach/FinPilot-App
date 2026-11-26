import asyncio
from collections import defaultdict
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from app.core.errors import RateLimitedError


class ConcurrencyLimiter:
    """Global and per-user concurrency guard."""

    def __init__(self, *, max_global: int = 32, max_per_user: int = 3) -> None:
        self._global_sem = asyncio.Semaphore(max_global)
        self._max_per_user = max_per_user
        self._user_counts: dict[str, int] = defaultdict(int)
        self._lock = asyncio.Lock()

    @asynccontextmanager
    async def acquire(self, user_key: str) -> AsyncIterator[None]:
        async with self._lock:
            if self._user_counts[user_key] >= self._max_per_user:
                raise RateLimitedError("Too many concurrent AI requests. Please wait a moment.")
            self._user_counts[user_key] += 1

        acquired_global = False
        try:
            try:
                await asyncio.wait_for(self._global_sem.acquire(), timeout=0.5)
                acquired_global = True
            except TimeoutError as exc:
                raise RateLimitedError() from exc
            yield
        finally:
            if acquired_global:
                self._global_sem.release()
            async with self._lock:
                self._user_counts[user_key] = max(0, self._user_counts[user_key] - 1)
                if self._user_counts[user_key] == 0:
                    self._user_counts.pop(user_key, None)
