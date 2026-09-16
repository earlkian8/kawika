import pytest

from app.core.errors import AppError
from app.security import rate_limit
from app.security.rate_limit import SlidingWindowLimiter, enforce


def test_allows_up_to_the_limit_then_blocks():
    limiter = SlidingWindowLimiter(limit=3, window_seconds=60)
    for _ in range(3):
        enforce(limiter, "k")
        limiter.hit("k")
    with pytest.raises(AppError) as exc:
        enforce(limiter, "k")
    assert exc.value.status_code == 429
    assert 0 < exc.value.detail["retry_after"] <= 60


def test_window_slides(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(rate_limit.time, "monotonic", lambda: now[0])
    limiter = SlidingWindowLimiter(limit=1, window_seconds=10)
    limiter.hit("k")
    assert limiter.retry_after("k") == 10
    now[0] += 10.5
    assert limiter.retry_after("k") == 0


def test_keys_are_independent_and_resettable():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=60)
    limiter.hit("a")
    assert limiter.retry_after("a") > 0
    assert limiter.retry_after("b") == 0
    limiter.reset("a")
    assert limiter.retry_after("a") == 0
