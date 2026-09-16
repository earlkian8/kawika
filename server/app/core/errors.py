"""Consistent error responses: `{"error": {"code", "message", "fields"?}}`."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException


class AppError(Exception):
    """A domain error that maps directly to an HTTP response."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        *,
        fields: dict[str, str] | None = None,
        headers: dict[str, str] | None = None,
        **extra: object,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.detail: dict[str, object] = {"code": code, "message": message, **extra}
        if fields:
            self.detail["fields"] = fields
        self.headers = headers


async def _app_error(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse({"error": exc.detail}, status_code=exc.status_code, headers=exc.headers)


async def _http_error(_request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "error", "message": str(exc.detail)}
    return JSONResponse({"error": detail}, status_code=exc.status_code, headers=exc.headers)


async def _validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
    # FastAPI's default response echoes submitted input back, which would
    # include passwords. Return field messages only.
    fields: dict[str, str] = {}
    for error in exc.errors():
        name = str(error["loc"][-1]) if error.get("loc") else "body"
        message = str(error.get("msg", "Invalid value.")).removeprefix("Value error, ")
        fields.setdefault(name, message)
    return JSONResponse(
        {"error": {"code": "invalid_input", "message": "Check the highlighted fields.", "fields": fields}},
        status_code=422,
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error)
    app.add_exception_handler(HTTPException, _http_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
