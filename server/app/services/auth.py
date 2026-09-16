"""Account business logic: registration and credential checks.

Routes stay thin (HTTP in, HTTP out); rules about accounts live here.
"""

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.security import passwords
from app.security.rate_limit import enforce, login_account_limiter, login_ip_limiter, register_ip_limiter

INVALID_CREDENTIALS = "That email, username, or password is incorrect."


def register_user(db: Session, payload: RegisterRequest, ip: str) -> User:
    enforce(register_ip_limiter, ip)
    register_ip_limiter.hit(ip)

    try:
        passwords.validate_password(
            payload.password,
            context=[payload.username, payload.display_name, payload.email.split("@")[0]],
        )
    except passwords.PasswordPolicyError as exc:
        raise AppError(422, "weak_password", str(exc), fields={"password": str(exc)}) from exc

    username_key = payload.username.lower()
    existing = db.scalars(
        select(User).where(or_(User.email == payload.email, User.username_key == username_key))
    ).all()
    fields: dict[str, str] = {}
    if any(u.username_key == username_key for u in existing):
        fields["username"] = "This username is taken. Try another."
    if any(u.email == payload.email for u in existing):
        fields["email"] = "This email can't be used. If it's yours, log in instead."
    if fields:
        raise AppError(409, "account_conflict", "Some details are already in use.", fields=fields)

    user = User(
        email=payload.email,
        username=payload.username,
        username_key=username_key,
        display_name=payload.display_name,
        password_hash=passwords.hash_password(payload.password),
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError as exc:
        # Lost a race with a simultaneous sign-up using the same details.
        db.rollback()
        raise AppError(409, "account_conflict", "Some details are already in use.") from exc
    return user


def authenticate(db: Session, payload: LoginRequest, ip: str) -> User:
    identifier = payload.identifier.strip().lower()
    account_key = f"account:{identifier}"

    enforce(login_ip_limiter, ip)
    enforce(login_account_limiter, account_key)
    login_ip_limiter.hit(ip)

    user = db.scalar(select(User).where(or_(User.email == identifier, User.username_key == identifier)))
    # Always runs a full Argon2 verification so response time does not reveal
    # whether the account exists.
    if not passwords.verify_password(user.password_hash if user else None, payload.password):
        login_account_limiter.hit(account_key)
        raise AppError(401, "invalid_credentials", INVALID_CREDENTIALS)

    assert user is not None
    login_account_limiter.reset(account_key)
    if passwords.needs_rehash(user.password_hash):
        user.password_hash = passwords.hash_password(payload.password)
    return user
