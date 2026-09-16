"""Migrate the test database and wipe its data. Used before end-to-end runs.

Refuses to touch any database whose name does not end in `_test`.
Usage (from server/): APP_ENV=test .venv/bin/python -m scripts.reset_test_db
"""

import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import text

from app.core.config import SERVER_DIR, settings
from app.db.session import engine


def main() -> int:
    database = engine.url.database or ""
    if settings.app_env != "test" or not database.endswith("_test"):
        print(f"Refusing to reset '{database}': set APP_ENV=test and use a *_test database.", file=sys.stderr)
        return 1

    config = Config(str(SERVER_DIR / "alembic.ini"))
    command.upgrade(config, "head")
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE auth_sessions, users RESTART IDENTITY CASCADE"))
    print(f"Reset {database}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
