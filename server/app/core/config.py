"""Application settings, loaded from environment variables and `server/.env`."""

import logging
import secrets
from datetime import timedelta
from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

logger = logging.getLogger("kawika")

SERVER_DIR = Path(__file__).resolve().parents[2]

CommaList = Annotated[list[str], NoDecode]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SERVER_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["development", "test", "production"] = "development"

    # PostgreSQL, e.g. postgresql+psycopg://kawika:<password>@127.0.0.1:5432/kawika
    database_url: str
    test_database_url: str | None = None

    client_origins: CommaList = ["http://localhost:5173"]
    allowed_hosts: CommaList = ["localhost", "127.0.0.1"]

    secret_key: str = ""
    cookie_secure: bool = True
    breach_check_enabled: bool = True

    # Rate limits (attempts per window). Tighten or loosen per environment.
    login_ip_limit: int = Field(default=30, ge=1)
    login_account_limit: int = Field(default=5, ge=1)
    register_ip_limit: int = Field(default=5, ge=1)

    session_idle_timeout: timedelta = timedelta(hours=2)
    session_absolute_timeout: timedelta = timedelta(hours=12)
    remember_idle_timeout: timedelta = timedelta(days=7)
    remember_absolute_timeout: timedelta = timedelta(days=30)

    @field_validator("client_origins", "allowed_hosts", mode="before")
    @classmethod
    def _split_commas(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("database_url", "test_database_url")
    @classmethod
    def _require_postgres(cls, value: str | None) -> str | None:
        if value is not None and not value.startswith("postgresql"):
            raise ValueError("Kawika requires PostgreSQL (postgresql+psycopg://...).")
        return value

    @model_validator(mode="after")
    def _check_production_safety(self) -> "Settings":
        if len(self.secret_key) < 32:
            if self.is_production:
                raise ValueError("SECRET_KEY must be at least 32 characters in production.")
            logger.warning("SECRET_KEY is missing or short; using an ephemeral development key.")
            self.secret_key = secrets.token_urlsafe(48)
        if self.is_production and not self.cookie_secure:
            raise ValueError("COOKIE_SECURE cannot be disabled in production.")
        return self

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def session_cookie_name(self) -> str:
        return "__Host-kawika_session" if self.cookie_secure else "kawika_session"

    @property
    def csrf_cookie_name(self) -> str:
        return "__Host-kawika_csrf" if self.cookie_secure else "kawika_csrf"


settings = Settings()  # type: ignore[call-arg]  # values come from the environment
