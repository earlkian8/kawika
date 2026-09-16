from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.schemas.user import UserOut
from app.security.csrf import new_csrf_token, set_csrf_cookie, verify_csrf
from app.security.sessions import (
    clear_session_cookie,
    client_ip,
    create_session,
    revoke_all_sessions,
    revoke_session,
    set_session_cookie,
)
from app.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _start_session(db: Session, request: Request, response: Response, user: User, remember: bool) -> None:
    # A fresh token on every login prevents session fixation.
    revoke_session(db, request)
    token = create_session(db, user, request, remember)
    db.commit()
    set_session_cookie(response, token, remember)
    set_csrf_cookie(response, new_csrf_token())


@router.get("/csrf", status_code=status.HTTP_204_NO_CONTENT)
def issue_csrf(response: Response) -> None:
    set_csrf_cookie(response, new_csrf_token())


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf)],
)
def register(
    payload: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)
) -> AuthResponse:
    user = auth_service.register_user(db, payload, client_ip(request))
    _start_session(db, request, response, user, remember=False)
    return AuthResponse(user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse, dependencies=[Depends(verify_csrf)])
def login(
    payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)
) -> AuthResponse:
    user = auth_service.authenticate(db, payload, client_ip(request))
    _start_session(db, request, response, user, remember=payload.remember)
    return AuthResponse(user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verify_csrf)])
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    revoke_session(db, request)
    db.commit()
    clear_session_cookie(response)
    set_csrf_cookie(response, new_csrf_token())


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verify_csrf)])
def logout_everywhere(
    response: Response, user: User = Depends(current_user), db: Session = Depends(get_db)
) -> None:
    revoke_all_sessions(db, user.id)
    db.commit()
    clear_session_cookie(response)
    set_csrf_cookie(response, new_csrf_token())


@router.get("/me", response_model=AuthResponse)
def me(user: User = Depends(current_user)) -> AuthResponse:
    return AuthResponse(user=UserOut.model_validate(user))
