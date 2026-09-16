# Kawika

> A progressive, gamified web platform empowering every Filipino to learn **Filipino Sign Language (FSL)** through micro quests and culturally grounded interactive challenges.

Kawika turns learning FSL into short, rewarding daily sessions. Instead of long lectures, learners complete bite-sized **micro quests** — a handful of signs, a quick recognition drill, a scenario set in a familiar Filipino setting — and build streaks, earn XP, and unlock new regions of the journey as they progress.

> **Status:** Early development. Secure accounts (register, log in, sessions), the home journey screen (sample data), PostgreSQL with migrations, and the `kawika` management CLI are built. Lessons and real progress data are next. See [docs/about.md](docs/about.md) for the vision and roadmap.

---

## Why Kawika?

Filipino Sign Language is the national sign language of the Filipino Deaf community (Republic Act No. 11106, *The Filipino Sign Language Act*). Yet most hearing Filipinos have never had an accessible way to learn it. Kawika aims to close that gap — making FSL approachable, habit-forming, and rooted in everyday Filipino life.

## Planned Features

- **Micro quests** — 3–5 minute lessons focused on a single theme (greetings, family, numbers, food, etc.)
- **Culturally grounded challenges** — scenarios like ordering at a *sari-sari* store, riding a jeepney, or greeting *Lola* at a family gathering
- **Progression system** — XP, levels, streaks, and badges to keep learners coming back
- **Sign library** — searchable video/animation reference for every sign learned
- **Practice modes** — recognition (watch → choose), recall (prompt → sign), and review of weak signs
- **Progressive Web App** — installable and usable on low-end phones and slow connections

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19, TypeScript, Vite, React Router, Motion, Lucide |
| Backend  | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Argon2 |
| Database | PostgreSQL 16 |
| Testing  | pytest, Vitest, Playwright, axe-core |
| Tooling  | ESLint, typescript-eslint |

## Project Structure

```
kawika/
├── client/              # React + TypeScript frontend (Vite)
│   ├── e2e/             # Playwright end-to-end (UAT) tests
│   └── src/
│       ├── app/         # App root, router, layouts
│       ├── pages/       # Route-level screens
│       ├── features/    # auth, journey, progress
│       └── shared/      # API client, UI controls, brand, styles
├── server/              # FastAPI backend
│   ├── app/             # api, cli, core, db, models, schemas, security, services
│   ├── migrations/      # Alembic revisions
│   └── tests/
├── docs/                # Project documentation
└── README.md
```

See [docs/architecture.md](docs/architecture.md) for conventions and how the layers depend on each other.

## Quick Start

**Prerequisites:** Node.js 20+, Python 3.12+, PostgreSQL 16+, Git.

```bash
# 1. Database: create the kawika role and databases (see docs/setup.md)

# 2. Backend
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # fill in DATABASE_URL, TEST_DATABASE_URL, SECRET_KEY
kawika db migrate --seed      # tables + demo login (demo / tara matuto ng senyas)
fastapi dev app/main.py       # http://localhost:8000

# 3. Frontend (second terminal)
cd client
npm install
npx playwright install chromium   # once, for end-to-end tests
npm run dev                   # http://localhost:5173
```

Full instructions and troubleshooting: **[docs/setup.md](docs/setup.md)**.

## Documentation

| Doc | Topic |
| --- | ----- |
| [About](docs/about.md) | Mission, principles, roadmap |
| [Setup](docs/setup.md) | Local development |
| [Architecture](docs/architecture.md) | Structure and conventions |
| [Backend](docs/backend.md) / [Frontend](docs/frontend.md) | Module reference |
| [Database](docs/database.md) | Schema and migrations |
| [Management CLI](docs/cli.md) | `kawika db migrate / fresh / seed` |
| [Security](docs/security.md) | Authentication design |
| [Testing](docs/testing.md) | Test layers and UAT scenarios |

## Scripts

| Where | Command | Description |
| ----- | ------- | ----------- |
| `client/` | `npm run dev` | Vite dev server with HMR |
| `client/` | `npm run build` | Type-check and build for production |
| `client/` | `npm run lint` | ESLint |
| `client/` | `npm test` | Unit tests |
| `client/` | `npm run test:e2e` | End-to-end UAT suite (starts its own API and web server) |
| `client/` | `npm run preview` | Serve the production build with security headers |
| `server/` | `fastapi dev app/main.py` | API with auto-reload |
| `server/` | `kawika db migrate` | Apply database migrations |
| `server/` | `kawika db fresh --seed` | Wipe, rebuild, and add demo data |
| `server/` | `kawika db seed` | Add demo data (safe to repeat) |
| `server/` | `kawika db status` | Migration state and row counts |
| `server/` | `pytest` | API, unit, and migration tests |

## Contributing

Contributions are welcome — especially from members of the Deaf community, FSL interpreters, and educators. Please open an issue to discuss a change before submitting a pull request.

Before opening a pull request:

1. Follow the folder and naming conventions in [docs/architecture.md](docs/architecture.md).
2. Add tests, and run every layer in [docs/testing.md](docs/testing.md) (server, client units, end-to-end).
3. Update the affected docs in `docs/` and the READMEs.
4. For schema changes, include the reviewed migration (`kawika db make-migration`).

## Acknowledgments

Kawika is built in recognition of the Filipino Deaf community, whose language, culture, and advocacy make this work possible.
