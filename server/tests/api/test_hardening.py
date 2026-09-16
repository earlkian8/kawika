from app.core.config import settings
from tests.conftest import VALID_USER, csrf_headers


def test_state_changing_requests_require_csrf_token(client):
    client.get("/api/auth/csrf")
    assert client.post("/api/auth/register", json=VALID_USER).status_code == 403

    forged = {"X-CSRF-Token": "forged.token"}
    client.cookies.set(settings.csrf_cookie_name, "forged.token")
    assert client.post("/api/auth/register", json=VALID_USER, headers=forged).status_code == 403


def test_cross_site_fetch_metadata_is_rejected(client):
    headers = {**csrf_headers(client), "Sec-Fetch-Site": "cross-site"}
    assert client.post("/api/auth/register", json=VALID_USER, headers=headers).status_code == 403


def test_foreign_origin_is_rejected(client):
    headers = {**csrf_headers(client), "Origin": "https://evil.example"}
    assert client.post("/api/auth/register", json=VALID_USER, headers=headers).status_code == 403


def test_unknown_host_is_rejected(client):
    assert client.get("/api/health", headers={"Host": "evil.example"}).status_code == 400


def test_unsupported_methods_and_routes_use_the_error_shape(client):
    missing = client.get("/api/does-not-exist")
    assert missing.status_code == 404
    assert "error" in missing.json()
    assert client.put("/api/auth/login").status_code == 405


def test_malformed_json_is_a_validation_error(client):
    headers = {**csrf_headers(client), "Content-Type": "application/json"}
    response = client.post("/api/auth/login", content="{not json", headers=headers)
    assert response.status_code == 422


def test_health_checks_the_database(client):
    assert client.get("/api/health").json() == {"status": "ok", "env": "test", "database": "ok"}


def test_api_responses_carry_security_headers(client):
    response = client.get("/api/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["Cache-Control"] == "no-store"
    assert "frame-ancestors 'none'" in response.headers["Content-Security-Policy"]
