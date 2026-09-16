"""Server-side sessions carried in an HttpOnly cookie.

The browser only ever holds an opaque 256-bit random token; nothing readable
by JavaScript can be used to authenticate. The database stores a SHA-256 of
that token, so a leaked database cannot be replayed as live sessions. Sessions
have both an idle and an absolute timeout and are revocable server-side.
"""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import Request, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import AuthSession, User

# Avoid a database write on every request; refresh last-seen at most this often.
TOUCH_INTERVAL = timedelta(minutes=1)
MAX_TOKEN_LENGTH = 128


def utcnow() -> datetime:
    return datetime.now(UTC)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def timeouts(remember: bool) -> tuple[timedelta, timedelta]:
    """Return (idle, absolute) timeouts for a session."""
    if remember:
        return settings.remember_idle_timeout, settings.remember_absolute_timeout
    return settings.session_idle_timeout, settings.session_absolute_timeout


def client_ip(request: Request) -> str:
    # Behind a reverse proxy, run uvicorn with --proxy-headers and
    # --forwarded-allow-ips so request.client reflects the real client.
    return request.client.host if request.client else "unknown"


def create_session(db: Session, user: User, request: Request, remember: bool) -> str:
    token = secrets.token_urlsafe(32)
    now = utcnow()
    _, absolute = timeouts(remember)
    db.execute(delete(AuthSession).where(AuthSession.user_id == user.id, AuthSession.expires_at < now))
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_token(token),
            remember=remember,
            created_at=now,
            last_seen_at=now,
            expires_at=now + absolute,
            user_agent=request.headers.get("user-agent", "")[:255],
            ip_address=client_ip(request)[:45],
        )
    )
    return token


def find_session(db: Session, request: Request) -> AuthSession | None:
    token = request.cookies.get(settings.session_cookie_name)
    if not token or len(token) > MAX_TOKEN_LENGTH:
        return None

    auth_session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if auth_session is None:
        return None

    now = utcnow()
    idle, _ = timeouts(auth_session.remember)
    if now >= auth_session.expires_at or now - auth_session.last_seen_at >= idle:
        db.delete(auth_session)
        db.commit()
        return None

    if now - auth_session.last_seen_at >= TOUCH_INTERVAL:
        auth_session.last_seen_at = now
        db.commit()
    return auth_session


def revoke_session(db: Session, request: Request) -> None:
    token = request.cookies.get(settings.session_cookie_name)
    if token and len(token) <= MAX_TOKEN_LENGTH:
        db.execute(delete(AuthSession).where(AuthSession.token_hash == hash_token(token)))


def revoke_all_sessions(db: Session, user_id: uuid.UUID) -> None:
    db.execute(delete(AuthSession).where(AuthSession.user_id == user_id))


def set_session_cookie(response: Response, token: str, remember: bool) -> None:
    response.set_cookie(
        settings.session_cookie_name,
        token,
        # Without "remember me" this is a browser-session cookie.
        max_age=int(settings.remember_absolute_timeout.total_seconds()) if remember else None,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.session_cookie_name,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )
