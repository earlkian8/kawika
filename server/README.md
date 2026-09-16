# Kawika server

FastAPI service for Kawika, backed by PostgreSQL.

```bash
source .venv/bin/activate
pip install -r requirements-dev.txt   # dependencies + the `kawika` CLI
kawika db migrate --seed              # tables + demo data
fastapi dev app/main.py               # http://localhost:8000, docs at /docs
pytest                                # uses TEST_DATABASE_URL (a *_test database)
```

Clean slate any time: `kawika db fresh --seed`. All commands: `kawika db --help`.

- Management CLI: [../docs/cli.md](../docs/cli.md)
- Module reference: [../docs/backend.md](../docs/backend.md)
- Database and migrations: [../docs/database.md](../docs/database.md)
- Security design: [../docs/security.md](../docs/security.md)
