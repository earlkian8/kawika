import random
import threading

import pytest
from sqlalchemy import text

from app.db.factories import learner_profile, slugify
from app.db.maintenance import DatabaseBusyError, describe_url, drop_all_objects
from app.db.seeders.users import DEMO_ACCOUNTS, DEMO_PASSWORD, LEARNER_PASSWORD
from app.db.session import engine
from app.schemas.auth import RESERVED_USERNAMES, USERNAME_PATTERN
from app.security import passwords


def test_slugify_handles_filipino_names():
    assert slugify("Niño Dela Cruz") == "nino_dela_cruz"
    assert slugify("  Ma. Josefina  ") == "ma_josefina"


def test_learner_profiles_are_valid_unique_and_reproducible():
    first = [learner_profile(random.Random(2026), i) for i in range(1, 1001)]
    again = [learner_profile(random.Random(2026), i) for i in range(1, 1001)]
    assert first[:5] == again[:5]  # same seed, same learners

    usernames = [p.username for p in first]
    assert len(set(usernames)) == len(usernames)
    for profile in first:
        assert USERNAME_PATTERN.fullmatch(profile.username), profile.username
        assert profile.username.lower() not in RESERVED_USERNAMES
        assert profile.email == profile.email.lower() and profile.email.endswith("@example.com")
        assert 1 <= len(profile.display_name) <= 50


def test_seed_passwords_satisfy_the_password_policy():
    for account in DEMO_ACCOUNTS:
        passwords.validate_password(DEMO_PASSWORD, context=[account["username"], account["display_name"]])
    passwords.validate_password(LEARNER_PASSWORD, context=["juan_santos_01", "Juan Santos"])


def test_describe_url_hides_the_password():
    assert describe_url("postgresql+psycopg://kawika:s3cret@127.0.0.1:5432/kawika") == "kawika@127.0.0.1:5432/kawika"


def test_drop_fails_fast_when_another_connection_holds_a_lock():
    holding = threading.Event()
    release = threading.Event()

    def hold_lock():
        with engine.connect() as connection, connection.begin():
            connection.execute(text("SELECT * FROM users"))  # ACCESS SHARE lock until commit
            holding.set()
            release.wait(10)

    locker = threading.Thread(target=hold_lock)
    locker.start()
    try:
        assert holding.wait(5)
        with pytest.raises(DatabaseBusyError, match="Stop running API servers"):
            drop_all_objects(engine, lock_timeout="300ms")
    finally:
        release.set()
        locker.join()
    # Nothing was dropped: the transaction rolled back as a whole.
    with engine.connect() as connection:
        assert connection.execute(text("SELECT to_regclass('users')")).scalar() == "users"
