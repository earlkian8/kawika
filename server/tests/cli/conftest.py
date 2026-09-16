import pytest
from alembic import command
from sqlalchemy import func, inspect, select
from typer.testing import CliRunner

from app.cli.main import app as cli_app
from app.db.session import SessionLocal, engine
from app.models import User
from tests.conftest import alembic_config


@pytest.fixture
def cli():
    """Invoke `kawika db --database test ...` and return the Click result."""
    runner = CliRunner()

    def invoke(*args: str, input: str | None = None):
        return runner.invoke(cli_app, ["db", "--database", "test", *args], input=input)

    return invoke


@pytest.fixture(autouse=True)
def _back_to_head():
    """Commands under test may drop or downgrade the schema; restore it for the next test."""
    yield
    engine.dispose()
    command.upgrade(alembic_config(), "head")


def user_count() -> int:
    with SessionLocal() as session:
        return session.scalar(select(func.count()).select_from(User))


def table_names() -> set[str]:
    engine.dispose()
    return set(inspect(engine).get_table_names())
