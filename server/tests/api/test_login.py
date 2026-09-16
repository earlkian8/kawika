import unicodedata

from app.core.config import settings
from tests.conftest import VALID_USER, csrf_headers, login, register


def test_login_with_email_or_username_in_any_case(client):
    register(client)
    for identifier in ("maria@example.com", "  MARIA@EXAMPLE.COM ", "Maria_Clara"):
        client.cookies.clear()
        assert login(client, identifier, VALID_USER["password"]).status_code == 200, identifier


def test_wrong_password_and_missing_account_look_identical(client):
    register(client)
    client.cookies.clear()
    wrong = login(client, "maria_clara", "wrong password here!!")
    missing = login(client, "nobody@example.com", "wrong password here!!")
    assert wrong.status_code == missing.status_code == 401
    assert wrong.json() == missing.json()


def test_injection_style_identifiers_are_just_wrong_credentials(client):
    register(client)
    client.cookies.clear()
    for identifier in ("' OR '1'='1", "maria_clara'--", "%", "*"):
        assert login(client, identifier, VALID_USER["password"]).status_code == 401


def test_password_unicode_normalisation(client):
    composed = "Mañana sa Parañaque, tara!"
    register(client, password=composed)
    client.cookies.clear()
    decomposed = unicodedata.normalize("NFD", composed)
    assert decomposed != composed
    assert login(client, "maria_clara", decomposed).status_code == 200


def test_repeated_failed_logins_are_throttled(client):
    register(client)
    client.cookies.clear()
    statuses = [login(client, "maria_clara", "definitely not it at all").status_code for _ in range(6)]
    assert statuses == [401] * 5 + [429]

    blocked = login(client, "maria_clara", VALID_USER["password"])
    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) > 0
    assert blocked.json()["error"]["retry_after"] > 0


def test_successful_login_resets_the_failure_count(client):
    register(client)
    client.cookies.clear()
    for _ in range(4):
        login(client, "maria_clara", "definitely not it at all")
    assert login(client, "maria_clara", VALID_USER["password"]).status_code == 200
    for _ in range(4):
        assert login(client, "maria_clara", "definitely not it at all").status_code == 401


def test_remember_me_sets_a_persistent_cookie(client):
    register(client)
    client.cookies.clear()

    def session_cookie(response):
        return next(
            c for c in response.headers.get_list("set-cookie") if c.startswith(settings.session_cookie_name)
        )

    assert "Max-Age" not in session_cookie(login(client, "maria_clara", VALID_USER["password"]))
    remembered = session_cookie(login(client, "maria_clara", VALID_USER["password"], remember=True))
    assert f"Max-Age={int(settings.remember_absolute_timeout.total_seconds())}" in remembered


def test_login_requires_csrf(client):
    register(client)
    client.cookies.clear()
    client.get("/api/auth/csrf")
    response = client.post(
        "/api/auth/login", json={"identifier": "maria_clara", "password": VALID_USER["password"]}
    )
    assert response.status_code == 403
    assert csrf_headers(client)  # a fresh token is always obtainable
