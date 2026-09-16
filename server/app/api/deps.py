"""Shared FastAPI dependencies."""

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.db.session import get_db
from app.models import User
from app.security.sessions import find_session


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_session = find_session(db, request)
    if auth_session is None:
        raise AppError(401, "not_authenticated", "Log in to continue.")
    return auth_session.user
