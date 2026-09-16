from sqlalchemy import select

from app.core.config import settings
from app.models import User
from tests.conftest import VALID_USER, csrf_headers, register


def test_register_creates_user_and_session(client, db):
    response = register(client)
    assert response.status_code == 201
    body = response.json()["user"]
    assert body["email"] == "maria@example.com"
    assert "password" not in response.text

    session_cookie = next(
        c for c in response.headers.get_list("set-cookie") if c.startswith(settings.session_cookie_name)
    )
    assert "HttpOnly" in session_cookie and "SameSite=strict" in session_cookie

    user = db.scalar(select(User))
    assert user.password_hash.startswith("$argon2id$")
    assert client.get("/api/auth/me").json()["user"]["username"] == "maria_clara"


def test_display_name_is_trimmed_and_collapsed(client):
    response = register(client, display_name="  Juan    dela   Cruz ")
    assert response.json()["user"]["display_name"] == "Juan dela Cruz"


def test_unicode_and_markup_are_stored_verbatim(client):
    name = "Ñiño <img src=x onerror=alert(1)> 🇵🇭"
    response = register(client, display_name=name)
    assert response.status_code == 201
    assert response.json()["user"]["display_name"] == name


def test_invalid_fields_report_each_problem(client):
    response = register(client, display_name="   ", username="no spaces!", email="juan@")
    assert response.status_code == 422
    fields = response.json()["error"]["fields"]
    assert {"display_name", "username", "email"} <= fields.keys()


def test_reserved_and_control_character_names_are_rejected(client):
    assert "username" in register(client, username="Admin").json()["error"]["fields"]
    assert "display_name" in register(client, display_name="Juan‮evil").json()["error"]["fields"]


def test_unknown_fields_are_rejected(client):
    response = client.post(
        "/api/auth/register", json={**VALID_USER, "is_admin": True}, headers=csrf_headers(client)
    )
    assert response.status_code == 422


def test_weak_passwords_are_rejected(client):
    for password in ("short pass", "aaaaaaaaaaaaaaaaaaaa", "maria_clara2024maria", "abcdefghijklmnopq"):
        response = register(client, password=password)
        assert response.status_code == 422, password
        assert "password" in response.json()["error"]["fields"]


def test_password_length_bounds(client):
    assert register(client, password="x" * 129).status_code == 422
    assert register(client, password="tahimik na umaga sa probinsya " * 4).status_code == 201


def test_validation_errors_never_echo_the_password(client):
    response = register(client, email="not-an-email", password="secret-value-" * 20)
    assert response.status_code == 422
    assert "secret-value" not in response.text


def test_duplicate_username_is_case_insensitive(client):
    register(client)
    client.cookies.clear()
    response = register(client, username="MARIA_CLARA", email="other@example.com")
    assert response.status_code == 409
    assert "username" in response.json()["error"]["fields"]


def test_duplicate_email_is_case_insensitive(client):
    register(client)
    client.cookies.clear()
    response = register(client, username="someone_else", email="MARIA@example.COM")
    assert response.status_code == 409
    assert "email" in response.json()["error"]["fields"]


def test_registration_is_rate_limited_per_ip(client):
    statuses = [
        register(client, username=f"user_{i}", email=f"user{i}@example.com").status_code
        for i in range(settings.register_ip_limit + 1)
    ]
    assert statuses[-1] == 429
