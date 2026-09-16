# Setup

This guide gets Kawika running locally: the React client, the FastAPI server, and a PostgreSQL database.

## 1. Prerequisites

| Tool       | Version | Check with            |
| ---------- | ------- | --------------------- |
| Git        | any     | `git --version`       |
| Node.js    | 20+     | `node -v`             |
| npm        | 10+     | `npm -v`              |
| Python     | 3.12+   | `python3 --version`   |
| PostgreSQL | 16+     | `psql --version`      |

On Ubuntu/Debian you may also need `sudo apt install python3-venv postgresql`.

## 2. Create the databases

Kawika uses one database for development and a separate `*_test` database for automated tests. Create a dedicated role (replace the password):

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE kawika WITH LOGIN PASSWORD 'choose-a-long-random-password';
CREATE DATABASE kawika OWNER kawika;
CREATE DATABASE kawika_test OWNER kawika;
REVOKE ALL ON DATABASE kawika FROM PUBLIC;
REVOKE ALL ON DATABASE kawika_test FROM PUBLIC;
SQL
```

Generate a strong password with `python3 -c "import secrets; print(secrets.token_urlsafe(24))"`. Use only letters, digits, `-` and `_` so it is safe inside a connection URL.

## 3. Server (`server/`)

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt

cp .env.example .env               # then edit the values below
alembic upgrade head               # create tables in the dev database
fastapi dev app/main.py            # http://localhost:8000
```

- Health check: http://localhost:8000/api/health (also confirms the database connection)
- Interactive API docs: http://localhost:8000/docs (disabled in production)

### Environment variables (`server/.env`)

| Variable | Purpose |
| -------- | ------- |
| `APP_ENV` | `development`, `test`, or `production`. Production hides API docs, enables HSTS, and refuses unsafe settings. |
| `DATABASE_URL` | `postgresql+psycopg://kawika:<password>@127.0.0.1:5432/kawika` |
| `TEST_DATABASE_URL` | Same role, the `kawika_test` database. Tests refuse any database not ending in `_test`. |
| `CLIENT_ORIGINS` | Frontend origins allowed to call the API (also checked for CSRF). |
| `ALLOWED_HOSTS` | Host names the API answers to. |
| `SECRET_KEY` | Signs CSRF tokens. Required, 32+ characters, in production. Generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. |
| `COOKIE_SECURE` | `false` only for plain-HTTP local development. Must be `true` in production. |
| `BREACH_CHECK_ENABLED` | Screens new passwords against Have I Been Pwned (k-anonymity). |
| `LOGIN_IP_LIMIT`, `LOGIN_ACCOUNT_LIMIT`, `REGISTER_IP_LIMIT` | Rate limits per 15 minutes (login) and per hour (sign-up). |

`.env` is git-ignored. Never commit real credentials.

## 4. Client (`client/`)

In a second terminal:

```bash
cd client
npm install
npm run dev                        # http://localhost:5173
```

The client needs no `.env` in development. Vite proxies `/api` to `http://localhost:8000`, so the browser sees one origin and the session cookie stays first-party. To point at another API, set `VITE_API_PROXY`.

### Client scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `client/dist` |
| `npm run preview` | Serve the production build with production security headers |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end UAT suite (Playwright), see [Testing](testing.md) |

## 5. Running everything

| Terminal | Directory | Command |
| -------- | --------- | ------- |
| 1 | `server/` | `source .venv/bin/activate && fastapi dev app/main.py` |
| 2 | `client/` | `npm run dev` |

Open http://localhost:5173, create an account, and you land on the home journey.

## 6. Production notes

- Serve the client build and the API from the **same origin** (for example a reverse proxy that routes `/api` to FastAPI). The session cookie is `SameSite=Strict`.
- Copy the security headers from `client/vite.config.ts` (`securityHeaders`) into that web server.
- Run uvicorn with `--proxy-headers --forwarded-allow-ips=<proxy ip>` so rate limiting sees real client IPs.
- Rate limits are in memory. Before running more than one API worker, move them to a shared store such as Redis.
- Run `alembic upgrade head` as part of every deploy.

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `role "earl" does not exist` from `psql` | Connect as the app role: `psql -h 127.0.0.1 -U kawika -d kawika` |
| `password authentication failed for user "kawika"` | The password in `DATABASE_URL` does not match the role. Reset it with `sudo -u postgres psql -c "ALTER ROLE kawika PASSWORD '...'"`. |
| `database_url Field required` on startup | `server/.env` is missing or has no `DATABASE_URL`. |
| `relation "users" does not exist` | Run `alembic upgrade head` in `server/`. |
| `fastapi: command not found` | Activate the virtual environment first. |
| Port 5173 or 8000 already in use | Stop the other process, or use `npm run dev -- --port 3000` / `fastapi dev app/main.py --port 8001`. |
| Login returns 403 "security token expired" | The API's `SECRET_KEY` changed. Refresh the page to get a new token. |
| `npm install` errors after switching Node versions | Delete `client/node_modules` and reinstall. |
