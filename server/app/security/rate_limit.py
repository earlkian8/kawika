"""In-memory sliding-window rate limiting.

Good for a single process. When running more than one worker, move the
buckets to a shared store such as Redis so limits apply across instances.
"""

import math
import threading
import time
from collections import defaultdict, deque

from fastapi import status

from app.core.config import settings
from app.core.errors import AppError


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque[float] | None:
        hits = self._hits.get(key)
        if hits is None:
            return None
        while hits and hits[0] <= now - self.window:
            hits.popleft()
        if not hits:
            del self._hits[key]
            return None
        return hits

    def retry_after(self, key: str) -> int:
        """Seconds until another hit is allowed, or 0 if allowed now."""
        with self._lock:
            now = time.monotonic()
            hits = self._prune(key, now)
            if hits is None or len(hits) < self.limit:
                return 0
            return max(1, math.ceil(hits[0] + self.window - now))

    def hit(self, key: str) -> None:
        with self._lock:
            now = time.monotonic()
            self._prune(key, now)
            self._hits[key].append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._hits.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._hits.clear()


def enforce(limiter: SlidingWindowLimiter, key: str) -> None:
    wait = limiter.retry_after(key)
    if wait:
        raise AppError(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "rate_limited",
            "Too many attempts. Take a short break and try again.",
            headers={"Retry-After": str(wait)},
            retry_after=wait,
        )


# Every login attempt from one IP address.
login_ip_limiter = SlidingWindowLimiter(limit=settings.login_ip_limit, window_seconds=15 * 60)
# Failed logins against one account, from anywhere. Throttles credential
# guessing without permanently locking the real owner out.
login_account_limiter = SlidingWindowLimiter(limit=settings.login_account_limit, window_seconds=15 * 60)
# Account creation from one IP address.
register_ip_limiter = SlidingWindowLimiter(limit=settings.register_ip_limit, window_seconds=60 * 60)


ALL_LIMITERS = (login_ip_limiter, login_account_limiter, register_ip_limiter)
