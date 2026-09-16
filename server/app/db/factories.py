"""Deterministic builders for realistic Kawika data (seeding and tests).

Names are common Filipino given names and surnames rather than a generic
faker locale, so seeded screens look like the people who will use Kawika.
"""

import random
import re
import unicodedata
from dataclasses import dataclass

GIVEN_NAMES = (
    "Juan", "Maria", "Jose", "Ana", "Miguel", "Andrea", "Paolo", "Bea", "Jomar", "Kristine",
    "Carlo", "Angelica", "Rafael", "Patricia", "Mark", "Joy", "Ramon", "Liza", "Enrique", "Camille",
    "Nico", "Grace", "Elmer", "Rosario", "Isagani", "Ligaya", "Dalisay", "Bayani", "Tala", "Amihan",
    "Niño", "Mayumi", "Josefina", "Emmanuel", "Precious", "Jericho", "Katrina", "Dionisio", "Marites", "Ronaldo",
)

SURNAMES = (
    "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Andrada",
    "Castillo", "Flores", "Villanueva", "Ramos", "Castro", "Rivera", "Aquino", "Navarro", "Salazar", "Mercado",
    "Dela Cruz", "Del Rosario", "Soriano", "Manalo", "Pascual", "Dizon", "Macaraeg", "Lim", "Tan", "Gonzales",
    "Magbanua", "Dimaculangan", "Pangilinan", "Sarmiento", "Buenaventura", "Agbayani", "Lacson", "Ilagan",
)

EMAIL_DOMAIN = "example.com"  # RFC 2606 reserved: never delivers real mail


@dataclass(frozen=True)
class LearnerProfile:
    display_name: str
    username: str
    email: str


def slugify(value: str) -> str:
    """ASCII, lowercase, underscores: "Niño Dela Cruz" -> "nino_dela_cruz"."""
    ascii_text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", ascii_text.lower()).strip("_")


def learner_profile(rng: random.Random, index: int) -> LearnerProfile:
    """The `index`-th learner for a given random generator.

    Usernames end in the index, so they are unique within a run and stable
    across runs with the same seed. They always satisfy the username rules
    (3-24 characters of letters, numbers, and underscores).
    """
    given = rng.choice(GIVEN_NAMES)
    surname = rng.choice(SURNAMES)
    suffix = f"_{index:02d}"
    base = slugify(f"{given} {surname}")[: 24 - len(suffix)].rstrip("_")
    username = f"{base}{suffix}"
    return LearnerProfile(
        display_name=f"{given} {surname}"[:50],
        username=username,
        email=f"{username}@{EMAIL_DOMAIN}",
    )
