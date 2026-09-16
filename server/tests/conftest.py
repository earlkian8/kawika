"""Test fixtures. Tests run against the PostgreSQL database in TEST_DATABASE_URL."""

import os

# Configure before the app (and its settings) are imported.
os.environ.update(
    APP_ENV="test",
    SECRET_KEY="test-secret-key-that-is-long-enough-for-hmac-signing",
    COOKIE_SECURE="false",
    BREACH_CHECK_ENABLED="false",
    ALLOWED_HOSTS="testserver",
    CLIENT_ORIGINS="http://testserver",
)

from pathlib import Path  # noqa: E402

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.security.rate_limit import ALL_LIMITERS  # noqa: E402

SERVER_DIR = Path(__file__).resolve().parents[1]

VALID_USER = {
    "display_name": "Maria Clara",
    "username": "maria_clara",
    "email": "Maria@Example.com",
    "password": "kain tayo sa bahay ni lola",
}


def alembic_config() -> Config:
    config = Config(str(SERVER_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(SERVER_DIR / "migrations"))
    return config


@pytest.fixture(scope="session", autouse=True)
def _migrated_database():
    assert engine.url.database and engine.url.database.endswith("_test"), (
        "Refusing to run tests against a non-test database."
    )
    config = alembic_config()
    command.downgrade(config, "base")
    command.upgrade(config, "head")
    yield


@pytest.fixture(autouse=True)
def _clean_state():
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE auth_sessions, users RESTART IDENTITY CASCADE"))
    for limiter in ALL_LIMITERS:
        limiter.clear()
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def csrf_headers(client: TestClient) -> dict[str, str]:
    client.get("/api/auth/csrf")
    return {"X-CSRF-Token": client.cookies.get(settings.csrf_cookie_name)}


def register(client: TestClient, **overrides):
    return client.post("/api/auth/register", json={**VALID_USER, **overrides}, headers=csrf_headers(client))


def login(client: TestClient, identifier: str, password: str, remember: bool = False):
    return client.post(
        "/api/auth/login",
        json={"identifier": identifier, "password": password, "remember": remember},
        headers=csrf_headers(client),
    )
