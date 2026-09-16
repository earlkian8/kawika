"""Password hashing and policy.

Hashing follows the OWASP Password Storage Cheat Sheet (Argon2id). The policy
follows NIST SP 800-63B-4: length over composition rules, a 15 character
minimum for single-factor passwords, no forced rotation, and screening against
known-compromised passwords.
"""

import hashlib
import logging
import re
import unicodedata

import httpx
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import settings

logger = logging.getLogger("kawika")

MIN_LENGTH = 15
MAX_LENGTH = 128

# argon2-cffi's defaults follow RFC 9106's low-memory profile
# (m=64 MiB, t=3, p=4), above OWASP's minimum of m=19 MiB, t=2, p=1.
_hasher = PasswordHasher()

# Verified against when an account does not exist, so a missing account takes
# as long to reject as a wrong password.
_DUMMY_HASH = _hasher.hash("kawika-timing-equaliser-not-a-real-password")

_COMMON_PASSWORDS = frozenset(
    {
        "passwordpassword",
        "password12345678",
        "123456789012345",
        "1234567890123456",
        "qwertyuiopasdfgh",
        "qwertyuiopasdfghjkl",
        "iloveyouiloveyou",
        "mahalkitamahalkita",
        "mahalkitaforever",
        "iloveyousomuch123",
        "letmeinletmein123",
        "welcomewelcome123",
        "abcdefghijklmnop",
        "philippines12345",
        "pilipinas1234567",
    }
)
_SEQUENCES = ("abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm", "01234567890")


class PasswordPolicyError(ValueError):
    pass


def normalize(password: str) -> str:
    # NIST recommends NFKC/NFKD so the same passphrase typed on different
    # keyboards (e.g. composed vs decomposed "ñ") verifies identically.
    return unicodedata.normalize("NFKC", password)


def hash_password(password: str) -> str:
    return _hasher.hash(normalize(password))


def verify_password(password_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, normalize(password)) and bool(
            password_hash
        )
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


def _is_sequence(value: str) -> bool:
    return any(value in seq or value in seq[::-1] for seq in _SEQUENCES)


def validate_password(password: str, *, context: list[str]) -> None:
    """Raise PasswordPolicyError with a user-facing message if the password is weak."""
    password = normalize(password)
    if len(password) < MIN_LENGTH:
        raise PasswordPolicyError(f"Use at least {MIN_LENGTH} characters.")
    if len(password) > MAX_LENGTH:
        raise PasswordPolicyError(f"Use {MAX_LENGTH} characters or fewer.")

    folded = password.casefold()
    compact = re.sub(r"[\s\W_]+", "", folded)

    if len(set(compact)) < 5:
        raise PasswordPolicyError("Mix in more different characters.")
    if compact in _COMMON_PASSWORDS or _is_sequence(compact):
        raise PasswordPolicyError("This password is too easy to guess.")

    stripped = compact
    for word in {"kawika", *(c.casefold() for c in context if len(c) >= 3)}:
        stripped = stripped.replace(re.sub(r"[\W_]+", "", word), "")
    if len(re.sub(r"\d+", "", stripped)) < 8:
        raise PasswordPolicyError("Don't build your password from your name, username, or email.")

    if settings.breach_check_enabled and is_breached(password):
        raise PasswordPolicyError(
            "This password has appeared in a data breach. Choose a different one."
        )


def is_breached(password: str) -> bool:
    """Check Have I Been Pwned without revealing the password.

    Only the first five characters of the SHA-1 hash leave the server
    (k-anonymity), and padding hides the true response size. If the service is
    unreachable the check is skipped rather than blocking sign-up.
    """
    digest = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()  # noqa: S324
    prefix, suffix = digest[:5], digest[5:]
    try:
        response = httpx.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            headers={"Add-Padding": "true", "User-Agent": "Kawika-FSL-Platform"},
            timeout=3.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        logger.warning("Breached password check unavailable; skipping.")
        return False

    for line in response.text.splitlines():
        candidate, _, count = line.partition(":")
        if candidate == suffix and count.strip() != "0":
            return True
    return False
