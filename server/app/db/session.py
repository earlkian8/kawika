"""Database engine and request-scoped sessions."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _database_url() -> str:
    if settings.app_env == "test":
        if not settings.test_database_url:
            raise RuntimeError("TEST_DATABASE_URL must be set when APP_ENV=test.")
        return settings.test_database_url
    return settings.database_url


engine = create_engine(
    _database_url(),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"connect_timeout": 5},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
