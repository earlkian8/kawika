# Kawika server

FastAPI service for Kawika, backed by PostgreSQL.

```bash
source .venv/bin/activate
alembic upgrade head
fastapi dev app/main.py   # http://localhost:8000, docs at /docs
pytest                    # uses TEST_DATABASE_URL
```

- Module reference: [../docs/backend.md](../docs/backend.md)
- Database and migrations: [../docs/database.md](../docs/database.md)
- Security design: [../docs/security.md](../docs/security.md)
