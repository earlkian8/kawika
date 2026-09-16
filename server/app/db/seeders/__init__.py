"""Seeder registry and runner.

Register new seeders in `SEEDERS`, in dependency order: a seeder may rely on
rows created by the ones before it.
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.db.seeders.base import SeedOptions, SeedResult, Seeder
from app.db.seeders.users import DemoAccountSeeder, LearnerSeeder

SEEDERS: dict[str, type[Seeder]] = {
    seeder.name: seeder
    for seeder in (
        DemoAccountSeeder,
        LearnerSeeder,
    )
}


class SeederError(ValueError):
    pass


@dataclass(frozen=True)
class SeedOutcome:
    name: str
    result: SeedResult


def select_seeders(names: list[str] | None, app_env: str) -> list[type[Seeder]]:
    """Seeders to run, in registry order, validated against the environment."""
    if names:
        unknown = sorted(set(names) - SEEDERS.keys())
        if unknown:
            raise SeederError(
                f"Unknown seeder: {', '.join(unknown)}. Available: {', '.join(SEEDERS)}."
            )
        chosen = [seeder for name, seeder in SEEDERS.items() if name in names]
    else:
        chosen = list(SEEDERS.values())

    blocked = [seeder.name for seeder in chosen if app_env not in seeder.environments]
    if blocked:
        raise SeederError(f"Not allowed in {app_env}: {', '.join(blocked)}.")
    return chosen


def run_seeders(session: Session, seeders: list[type[Seeder]], options: SeedOptions) -> list[SeedOutcome]:
    """Run seeders one by one, committing after each so a failure keeps earlier work."""
    outcomes: list[SeedOutcome] = []
    for seeder_class in seeders:
        try:
            result = seeder_class(session, options).run()
            session.commit()
        except Exception:
            session.rollback()
            raise
        outcomes.append(SeedOutcome(seeder_class.name, result))
    return outcomes


__all__ = ["SEEDERS", "SeedOptions", "SeedOutcome", "SeedResult", "Seeder", "SeederError", "run_seeders", "select_seeders"]
