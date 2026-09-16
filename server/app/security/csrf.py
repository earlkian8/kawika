"""Cross-site request forgery defences, layered per the OWASP CSRF cheat sheet.

1. Session cookie is SameSite=Strict.
2. Fetch Metadata: browsers label every request with Sec-Fetch-Site; anything
   cross-site is refused on state-changing methods.
3. Origin header, when present, must be an allowed origin.
4. Signed double-submit token: the X-CSRF-Token header must equal the CSRF
   cookie and carry a valid HMAC, so an injected cookie is useless.
"""

import hashlib
import hmac
import secrets

from fastapi import Request, Response, status

from app.core.config import settings
from app.core.errors import AppError

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
CSRF_HEADER = "X-CSRF-Token"


def _sign(nonce: str) -> str:
    return hmac.new(settings.secret_key.encode(), nonce.encode(), hashlib.sha256).hexdigest()


def new_csrf_token() -> str:
    nonce = secrets.token_urlsafe(32)
    return f"{nonce}.{_sign(nonce)}"


def _valid_signature(token: str) -> bool:
    nonce, _, signature = token.partition(".")
    return bool(nonce and signature) and hmac.compare_digest(signature, _sign(nonce))


def set_csrf_cookie(response: Response, token: str) -> None:
    # Readable by JavaScript on purpose: the client copies it into a header.
    response.set_cookie(
        settings.csrf_cookie_name,
        token,
        httponly=False,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )


def _forbidden(message: str) -> AppError:
    return AppError(status.HTTP_403_FORBIDDEN, "csrf_failed", message)


def verify_csrf(request: Request) -> None:
    """Dependency for every state-changing endpoint."""
    if request.method in SAFE_METHODS:
        return

    fetch_site = request.headers.get("sec-fetch-site")
    if fetch_site and fetch_site not in {"same-origin", "same-site", "none"}:
        raise _forbidden("Cross-site request blocked.")

    origin = request.headers.get("origin")
    if origin and origin not in settings.client_origins:
        raise _forbidden("Request origin is not allowed.")

    cookie_token = request.cookies.get(settings.csrf_cookie_name, "")
    header_token = request.headers.get(CSRF_HEADER, "")
    if (
        not cookie_token
        or not header_token
        or not hmac.compare_digest(cookie_token, header_token)
        or not _valid_signature(header_token)
    ):
        raise _forbidden("Your security token expired. Refresh the page and try again.")
