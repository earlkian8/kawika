"""HTTP middleware: security headers, CORS, and host validation."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings


async def security_headers(request: Request, call_next):
    response = await call_next(request)
    headers = response.headers
    headers.setdefault("X-Content-Type-Options", "nosniff")
    headers.setdefault("Referrer-Policy", "no-referrer")
    headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
    headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
    if request.url.path.startswith("/api"):
        headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        headers.setdefault("Cache-Control", "no-store")
    if settings.is_production:
        headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
    return response


def register_middleware(app: FastAPI) -> None:
    app.middleware("http")(security_headers)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.client_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-CSRF-Token"],
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
