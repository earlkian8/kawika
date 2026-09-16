# Backend modules (`server/`)

Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL (psycopg 3), Alembic, Argon2.

Entry point: `app/main.py` builds the app with `create_app()`. Run it with `fastapi dev app/main.py`.

Management commands: `kawika db ...` (see [Management CLI](cli.md)).

## `app/cli/` — management commands

| Module | Responsibility |
| ------ | -------------- |
| `main.py` | Root Typer app registered as the `kawika` console script (`pyproject.toml`). |
| `db.py` | `migrate`, `fresh`, `seed`, `status`, `rollback`, `reset`, `make-migration`, and `check`, with confirmation and production guards. |
| `output.py` | Consistent console messages. |

## `app/core/` — cross-cutting setup

| Module | Responsibility |
| ------ | -------------- |
| `config.py` | `Settings` (pydantic-settings) loaded from the environment and `server/.env`. Validates PostgreSQL URLs and refuses unsafe production config (short `SECRET_KEY`, insecure cookies). |
| `middleware.py` | Security headers (CSP, `nosniff`, COOP/CORP, HSTS in production, `no-store` on `/api`), CORS, and the Host allowlist. |
| `errors.py` | `AppError` for domain errors, plus handlers that return one error shape: `{"error": {"code", "message", "fields"?}}`. Validation errors never echo submitted values. |

## `app/db/` — database plumbing

| Module | Responsibility |
| ------ | -------------- |
| `base.py` | `Base` with a naming convention, so constraint names are stable across migrations. |
| `session.py` | Engine (pool pre-ping, timeouts), `get_db()` request-scoped sessions, and `resolve_database_url()` (default or test database). |
| `migrations.py` | Alembic config built from settings, migration state (applied/pending), and upgrade/downgrade/revision/check helpers. |
| `maintenance.py` | Drop every schema object in one transaction with a lock timeout, table row counts, and password-free URL display. |
| `seeders/` | `Seeder` base class, the ordered `SEEDERS` registry, and the demo-account and learner seeders. |
| `factories.py` | Deterministic learner profiles with common Filipino names. |

## `app/models/` — tables

| Model | Table | Notes |
| ----- | ----- | ----- |
| `User` | `users` | UUID id, lowercase `email` (unique), `username` plus lowercase `username_key` (unique), `display_name`, Argon2 `password_hash`. Check constraints enforce the lowercase rules. |
| `AuthSession` | `auth_sessions` | One row per signed-in device. Stores `SHA-256(token)`, timeouts, user agent, IP. Deleted with its user (`ON DELETE CASCADE`). |

See [Database](database.md) for the full schema.

## `app/schemas/` — request and response bodies

| Module | Contents |
| ------ | -------- |
| `auth.py` | `RegisterRequest` (name cleanup, username pattern, reserved names, email normalisation), `LoginRequest`, `AuthResponse`. Unknown fields are rejected. |
| `user.py` | `UserOut`, the public user shape. Never includes the password hash. |

## `app/security/` — security primitives

| Module | Responsibility |
| ------ | -------------- |
| `passwords.py` | Argon2id hashing and verification with automatic rehash, NFKC normalisation, the NIST SP 800-63B-4 policy, and the Have I Been Pwned range check. |
| `sessions.py` | Create, find, and revoke sessions. Handles idle and absolute timeouts and sets or clears the `HttpOnly` cookie. |
| `csrf.py` | Signed double-submit tokens, Fetch Metadata and `Origin` checks (`verify_csrf` dependency). |
| `rate_limit.py` | Thread-safe sliding-window limiters for login by IP, login by account, and registration by IP. |

## `app/services/` — business rules

| Module | Responsibility |
| ------ | -------------- |
| `auth.py` | `register_user()` (limits, password policy, duplicate checks, race-safe insert) and `authenticate()` (limits, timing-safe credential check, rehash). |

## `app/api/` — HTTP layer

| Module | Responsibility |
| ------ | -------------- |
| `router.py` | Collects every route module into `api_router`. |
| `deps.py` | `current_user` dependency (401 when no valid session). |
| `routes/health.py` | `GET /api/health`, which also pings the database. |
| `routes/auth.py` | The auth endpoints below. |

### Endpoints

| Method | Path | CSRF | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/health` | – | Service and database status |
| GET | `/api/auth/csrf` | – | Issue a CSRF cookie |
| POST | `/api/auth/register` | ✓ | Create an account and sign in (201) |
| POST | `/api/auth/login` | ✓ | Sign in with email or username (`remember` for 30 days) |
| POST | `/api/auth/logout` | ✓ | End this session (204) |
| POST | `/api/auth/logout-all` | ✓ | End every session for the user (204) |
| GET | `/api/auth/me` | – | Current user, or 401 |

Error codes: `invalid_input`, `weak_password`, `account_conflict`, `invalid_credentials`, `rate_limited` (with `retry_after`), `csrf_failed`, `not_authenticated`.

## Other folders

| Path | Purpose |
| ---- | ------- |
| `migrations/` | Alembic environment and revisions. |
| `tests/` | See [Testing](testing.md). |
| `pyproject.toml` | Project metadata, the `kawika` console script, and pytest configuration. |
| `requirements.txt` / `requirements-dev.txt` | Pinned runtime and development dependencies. |
