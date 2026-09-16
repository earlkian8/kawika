"""User seeders: known demo accounts and a crowd of sample learners."""

import random

from sqlalchemy import select

from app.db.factories import EMAIL_DOMAIN, learner_profile
from app.db.seeders.base import SeedResult, Seeder
from app.models import User
from app.security.passwords import hash_password

# Local-only credentials, documented in docs/cli.md. Never seeded in production.
DEMO_PASSWORD = "tara matuto ng senyas"
LEARNER_PASSWORD = "sample learner passphrase"

DEMO_ACCOUNTS = (
    {"username": "demo", "display_name": "Juan dela Cruz"},
    {"username": "demo_mentor", "display_name": "Maria Clara Santos"},
)


def _existing_usernames(session, keys: list[str]) -> set[str]:
    if not keys:
        return set()
    return set(session.scalars(select(User.username_key).where(User.username_key.in_(keys))))


class DemoAccountSeeder(Seeder):
    name = "demo-accounts"
    description = "Accounts with known passwords for trying the app locally"

    def run(self) -> SeedResult:
        result = SeedResult()
        existing = _existing_usernames(self.session, [a["username"] for a in DEMO_ACCOUNTS])
        password_hash = None
        for account in DEMO_ACCOUNTS:
            if account["username"] in existing:
                result.skipped += 1
                continue
            password_hash = password_hash or hash_password(DEMO_PASSWORD)
            self.session.add(
                User(
                    email=f"{account['username']}@{EMAIL_DOMAIN}",
                    username=account["username"],
                    username_key=account["username"],
                    display_name=account["display_name"],
                    password_hash=password_hash,
                )
            )
            result.created += 1
        usernames = ", ".join(a["username"] for a in DEMO_ACCOUNTS)
        result.notes.append(f"Log in as {usernames} with password: {DEMO_PASSWORD}")
        return result


class LearnerSeeder(Seeder):
    name = "learners"
    description = "Sample learners with Filipino names (use --learners to change how many)"

    def run(self) -> SeedResult:
        result = SeedResult()
        rng = random.Random(self.options.random_seed)
        profiles = [learner_profile(rng, index) for index in range(1, self.options.learners + 1)]
        existing = _existing_usernames(self.session, [p.username for p in profiles])

        # One Argon2 hash shared by every sample learner keeps large seeds fast.
        password_hash = None
        for profile in profiles:
            if profile.username in existing:
                result.skipped += 1
                continue
            password_hash = password_hash or hash_password(LEARNER_PASSWORD)
            self.session.add(
                User(
                    email=profile.email,
                    username=profile.username,
                    username_key=profile.username,
                    display_name=profile.display_name,
                    password_hash=password_hash,
                )
            )
            result.created += 1
        if profiles:
            result.notes.append(f"Sample learners share the password: {LEARNER_PASSWORD}")
        return result
