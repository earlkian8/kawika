"""Building blocks shared by every seeder."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import ClassVar

from sqlalchemy.orm import Session


@dataclass(frozen=True)
class SeedOptions:
    """Knobs a seed run can tune from the command line."""

    learners: int = 12
    # Fixed seed so every `fresh --seed` produces the same data.
    random_seed: int = 2026


@dataclass
class SeedResult:
    created: int = 0
    skipped: int = 0
    notes: list[str] = field(default_factory=list)


class Seeder(ABC):
    """One unit of seed data. Seeders must be idempotent: running twice creates nothing new."""

    name: ClassVar[str]
    description: ClassVar[str]
    # Environments the seeder may run in. Demo data never belongs in production.
    environments: ClassVar[frozenset[str]] = frozenset({"development", "test"})

    def __init__(self, session: Session, options: SeedOptions) -> None:
        self.session = session
        self.options = options

    @abstractmethod
    def run(self) -> SeedResult:
        """Insert this seeder's rows. The caller commits."""
