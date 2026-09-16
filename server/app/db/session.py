"""Database engine and request-scoped sessions."""

from collections.abc import Iterator
from typing import Literal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

DatabaseTarget = Literal["default", "test"]


def resolve_database_url(target: DatabaseTarget | None = None) -> str:
    """URL for a database target. Without a target, follows APP_ENV."""
    if target is None:
        target = "test" if settings.app_env == "test" else "default"
    if target == "test":
        if not settings.test_database_url:
            raise RuntimeError("TEST_DATABASE_URL must be set to use the test database.")
        return settings.test_database_url
    return settings.database_url


engine = create_engine(
    resolve_database_url(),
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
