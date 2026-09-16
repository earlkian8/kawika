"""Kawika API entry point. Run with `fastapi dev app/main.py`."""

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.middleware import register_middleware


def create_app() -> FastAPI:
    app = FastAPI(
        title="Kawika API",
        description="Backend for Kawika, a gamified platform for learning Filipino Sign Language.",
        version="0.1.0",
        # Don't publish the API map in production.
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
        openapi_url=None if settings.is_production else "/openapi.json",
    )
    register_middleware(app)
    register_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
