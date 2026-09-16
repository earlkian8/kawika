"""Request and response bodies for /api/auth."""

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.user import UserOut
from app.security.passwords import MAX_LENGTH

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_]{3,24}$")
RESERVED_USERNAMES = frozenset(
    {"admin", "administrator", "kawika", "moderator", "mod", "root", "support",
     "system", "staff", "help", "api", "null", "undefined", "me", "settings"}
)
_CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f-\x9f​-‏‪-‮⁦-⁩]")


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)


class RegisterRequest(_Strict):
    display_name: str = Field(min_length=1, max_length=50)
    username: str = Field(min_length=3, max_length=24)
    email: EmailStr = Field(max_length=254)
    # Passwords are never stripped or altered beyond Unicode normalisation.
    password: str = Field(min_length=1, max_length=MAX_LENGTH)

    @field_validator("display_name")
    @classmethod
    def _clean_display_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value or _CONTROL_CHARS.search(value):
            raise ValueError("Enter the name you'd like to be called.")
        return value

    @field_validator("username")
    @classmethod
    def _check_username(cls, value: str) -> str:
        value = value.strip()
        if not USERNAME_PATTERN.fullmatch(value):
            raise ValueError("Use 3–24 letters, numbers, or underscores.")
        if value.lower() in RESERVED_USERNAMES:
            raise ValueError("This username is reserved. Try another.")
        return value

    @field_validator("email")
    @classmethod
    def _lower_email(cls, value: str) -> str:
        return value.lower()


class LoginRequest(_Strict):
    identifier: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=MAX_LENGTH)
    remember: bool = False


class AuthResponse(BaseModel):
    user: UserOut
