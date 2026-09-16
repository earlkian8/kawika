from alembic import command

from tests.conftest import alembic_config


def test_models_match_migrations():
    # Fails if a model changed without a matching Alembic revision.
    command.check(alembic_config())


def test_migrations_downgrade_and_upgrade_cleanly():
    config = alembic_config()
    command.downgrade(config, "base")
    command.upgrade(config, "head")
