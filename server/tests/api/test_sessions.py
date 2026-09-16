from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select, update

from app.core.config import settings
from app.main import app
from app.models import AuthSession, User
from app.security.sessions import hash_token, utcnow
from tests.conftest import VALID_USER, csrf_headers, login, register


def test_me_requires_a_session(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_session_token_is_stored_hashed(client, db):
    register(client)
    token = client.cookies.get(settings.session_cookie_name)
    stored = db.scalar(select(AuthSession))
    assert stored.token_hash == hash_token(token)
    assert token not in stored.token_hash


def test_login_rotates_session_token(client):
    register(client)
    first = client.cookies.get(settings.session_cookie_name)
    login(client, "maria_clara", VALID_USER["password"])
    second = client.cookies.get(settings.session_cookie_name)
    assert first and second and first != second

    client.cookies.set(settings.session_cookie_name, first)
    assert client.get("/api/auth/me").status_code == 401


def test_logout_revokes_session_server_side(client):
    register(client)
    token = client.cookies.get(settings.session_cookie_name)
    assert client.post("/api/auth/logout", headers=csrf_headers(client)).status_code == 204

    client.cookies.set(settings.session_cookie_name, token)
    assert client.get("/api/auth/me").status_code == 401


def test_logout_all_revokes_every_device(client, db):
    register(client)
    with TestClient(app) as laptop:
        assert login(laptop, "maria_clara", VALID_USER["password"]).status_code == 200
        assert len(db.scalars(select(AuthSession)).all()) == 2

        assert client.post("/api/auth/logout-all", headers=csrf_headers(client)).status_code == 204
        assert laptop.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me").status_code == 401
    assert db.scalars(select(AuthSession)).all() == []


def test_idle_session_expires(client, db):
    register(client)
    stale = utcnow() - settings.session_idle_timeout - timedelta(seconds=1)
    db.execute(update(AuthSession).values(last_seen_at=stale))
    db.commit()
    assert client.get("/api/auth/me").status_code == 401
    assert db.scalars(select(AuthSession)).all() == []


def test_absolute_expiry_applies_even_when_active(client, db):
    register(client)
    db.execute(update(AuthSession).values(expires_at=utcnow() - timedelta(seconds=1)))
    db.commit()
    assert client.get("/api/auth/me").status_code == 401


def test_tampered_or_oversized_tokens_are_ignored(client):
    register(client)
    for token in ("forged", "x" * 500, "' OR 1=1 --"):
        client.cookies.set(settings.session_cookie_name, token)
        assert client.get("/api/auth/me").status_code == 401


def test_deleting_a_user_removes_their_sessions(client, db):
    register(client)
    db.delete(db.scalar(select(User)))
    db.commit()
    assert db.scalars(select(AuthSession)).all() == []
    assert client.get("/api/auth/me").status_code == 401
