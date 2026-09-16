import hashlib

import httpx
import pytest

from app.security import passwords


def test_hash_and_verify_round_trip():
    hashed = passwords.hash_password("isang dalawa tatlo apat")
    assert hashed.startswith("$argon2id$")
    assert passwords.verify_password(hashed, "isang dalawa tatlo apat")
    assert not passwords.verify_password(hashed, "isang dalawa tatlo lima")


def test_verify_handles_missing_and_corrupt_hashes():
    assert not passwords.verify_password(None, "anything at all here")
    assert not passwords.verify_password("not-a-hash", "anything at all here")


@pytest.mark.parametrize(
    ("password", "message"),
    [
        ("maikli", "at least 15"),
        ("aaaaabbbbbaaaaabbbbb", "different characters"),
        ("qwertyuiopasdfghjkl", "too easy"),
        ("juandelacruz12345", "name, username, or email"),
    ],
)
def test_policy_messages(password, message):
    with pytest.raises(passwords.PasswordPolicyError, match=message):
        passwords.validate_password(password, context=["juandelacruz"])


def test_passphrases_pass_the_policy():
    passwords.validate_password("sabay kain sa bahay ni lola", context=["juan"])


def test_breach_check_uses_k_anonymity(monkeypatch):
    password = "correct horse battery staple"
    digest = hashlib.sha1(password.encode()).hexdigest().upper()
    requested = {}

    def fake_get(url, **kwargs):
        requested["url"], requested["headers"] = url, kwargs["headers"]
        return httpx.Response(200, text=f"{digest[5:]}:42\nABCDEF:0", request=httpx.Request("GET", url))

    monkeypatch.setattr(passwords.httpx, "get", fake_get)
    assert passwords.is_breached(password)
    assert requested["url"].endswith(digest[:5])
    assert digest[5:] not in requested["url"]
    assert requested["headers"]["Add-Padding"] == "true"


def test_breach_check_fails_open_when_offline(monkeypatch):
    def offline(url, **kwargs):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(passwords.httpx, "get", offline)
    assert passwords.is_breached("anything long enough here") is False
