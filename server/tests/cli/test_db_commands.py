import re

from sqlalchemy import text

from app.cli import db as db_cli
from app.core.config import settings
from app.db.seeders.users import DEMO_PASSWORD
from app.db.session import engine
from tests.cli.conftest import table_names, user_count
from tests.conftest import login

HEAD = re.compile(r"[0-9a-f]{12}")


# migrate / status ---------------------------------------------------------


def test_status_reports_revisions_and_row_counts(cli):
    result = cli("status")
    assert result.exit_code == 0, result.output
    assert "kawika_test" in result.output
    assert "applied" in result.output and "Up to date" in result.output
    assert re.search(r"users\s+0", result.output)


def test_status_never_prints_the_password(cli):
    password = engine.url.password
    assert password and password not in cli("status").output


def test_migrate_is_idempotent(cli):
    result = cli("migrate")
    assert result.exit_code == 0
    assert "Already up to date" in result.output


def test_rollback_then_migrate(cli):
    result = cli("rollback", "--force")
    assert result.exit_code == 0, result.output
    assert "Reverted" in result.output
    assert "users" not in table_names()
    assert "pending" in cli("status").output

    result = cli("migrate")
    assert result.exit_code == 0, result.output
    assert "1 applied" in result.output
    assert {"users", "auth_sessions"} <= table_names()


def test_rollback_with_nothing_applied(cli):
    cli("reset", "--force")
    result = cli("rollback", "--force")
    assert result.exit_code == 0
    assert "Nothing to roll back" in result.output


def test_reset_reverts_everything(cli):
    result = cli("reset", "--force")
    assert result.exit_code == 0, result.output
    assert table_names() == {"alembic_version"}
    assert "Nothing to reset" in cli("reset", "--force").output


def test_migrate_to_a_specific_revision(cli):
    cli("reset", "--force")
    head = HEAD.search(cli("status").output).group(0)
    result = cli("migrate", "--to", head)
    assert result.exit_code == 0, result.output
    assert f"Migrated to {head}" in result.output


def test_make_migration_refuses_when_nothing_changed(cli):
    result = cli("make-migration", "nothing to see")
    assert result.exit_code == 1
    assert "No model changes detected" in result.output


def test_make_migration_empty_creates_a_revision_file(cli):
    from pathlib import Path

    versions = Path(__file__).resolve().parents[2] / "migrations" / "versions"
    before = set(versions.glob("*.py"))
    result = cli("make-migration", "backfill display names", "--empty")
    created = set(versions.glob("*.py")) - before
    try:
        assert result.exit_code == 0, result.output
        assert len(created) == 1
        path = created.pop()
        assert path.name.endswith("_backfill_display_names.py")
        assert "backfill display names" in path.read_text()
    finally:
        for path in set(versions.glob("*.py")) - before:
            path.unlink()


def test_check_passes_when_models_match(cli):
    result = cli("check")
    assert result.exit_code == 0, result.output
    assert "Models match the migrations" in result.output


# fresh -------------------------------------------------------------------


def test_fresh_wipes_data_and_objects_migrations_do_not_know(cli):
    cli("seed")
    assert user_count() > 0
    with engine.begin() as connection:
        connection.execute(text("CREATE TYPE stray_mood AS ENUM ('masaya', 'malungkot')"))
        connection.execute(text("CREATE TABLE stray_notes (id serial PRIMARY KEY, mood stray_mood)"))
        connection.execute(text("CREATE VIEW stray_view AS SELECT id FROM stray_notes"))

    result = cli("fresh", "--force")
    assert result.exit_code == 0, result.output
    assert "Fresh database" in result.output
    assert table_names() == {"alembic_version", "users", "auth_sessions"}
    with engine.connect() as connection:
        assert connection.execute(text("SELECT count(*) FROM pg_type WHERE typname = 'stray_mood'")).scalar() == 0
        assert connection.execute(text("SELECT count(*) FROM pg_views WHERE viewname = 'stray_view'")).scalar() == 0
    assert user_count() == 0


def test_fresh_with_seed(cli):
    result = cli("fresh", "--seed", "--learners", "3", "--force")
    assert result.exit_code == 0, result.output
    assert user_count() == 2 + 3


def test_fresh_needs_confirmation_when_not_interactive(cli):
    cli("seed")
    before = user_count()
    result = cli("fresh")
    assert result.exit_code == 1
    assert "Pass --force" in result.output
    assert user_count() == before


def test_fresh_prompt_can_be_declined_or_accepted(cli, monkeypatch):
    monkeypatch.setattr(db_cli, "interactive", lambda: True)
    cli("seed")
    before = user_count()

    declined = cli("fresh", input="n\n")
    assert declined.exit_code == 1
    assert "Cancelled" in declined.output
    assert user_count() == before

    accepted = cli("fresh", input="y\n")
    assert accepted.exit_code == 0, accepted.output
    assert user_count() == 0


# seed --------------------------------------------------------------------


def test_seed_is_idempotent(cli):
    first = cli("seed")
    assert first.exit_code == 0, first.output
    assert re.search(r"demo-accounts\s+2\s+0", first.output)
    assert re.search(r"learners\s+12\s+0", first.output)

    second = cli("seed")
    assert re.search(r"demo-accounts\s+0\s+2", second.output)
    assert re.search(r"learners\s+0\s+12", second.output)
    assert user_count() == 14


def test_seed_only_selected_seeders(cli):
    result = cli("seed", "--seeder", "learners", "--learners", "4")
    assert result.exit_code == 0, result.output
    assert "demo-accounts" not in result.output
    assert user_count() == 4


def test_seed_growing_the_learner_count_adds_only_new_ones(cli):
    cli("seed", "-s", "learners", "--learners", "3")
    result = cli("seed", "-s", "learners", "--learners", "5")
    assert re.search(r"learners\s+2\s+3", result.output)


def test_seed_rejects_unknown_seeders(cli):
    result = cli("seed", "--seeder", "badges")
    assert result.exit_code == 1
    assert "Unknown seeder: badges" in result.output
    assert "demo-accounts, learners" in result.output


def test_seed_validates_learner_count(cli):
    assert cli("seed", "--learners", "-1").exit_code == 2
    assert cli("seed", "--learners", "5000").exit_code == 2


def test_seed_refuses_pending_migrations(cli):
    cli("rollback", "--force")
    result = cli("seed")
    assert result.exit_code == 1
    assert "pending migration" in result.output


def test_seeded_demo_account_can_log_in(cli, client):
    cli("seed", "--seeder", "demo-accounts")
    response = login(client, "demo", DEMO_PASSWORD)
    assert response.status_code == 200, response.text
    assert response.json()["user"]["display_name"] == "Juan dela Cruz"


# guards ------------------------------------------------------------------


def test_production_default_database_is_protected(monkeypatch):
    from typer.testing import CliRunner

    from app.cli.main import app as cli_app

    monkeypatch.setattr(settings, "app_env", "production")
    runner = CliRunner()

    # Each command refuses before opening a connection to the real database.
    monkeypatch.setattr(db_cli, "connect", lambda target: (_ for _ in ()).throw(AssertionError("connected")))
    for command, message in (
        (["fresh"], "Refusing to drop all data in the production database"),
        (["reset"], "Refusing to undo every migration on the production database"),
        (["rollback"], "Refusing to roll back migrations on the production database"),
    ):
        result = runner.invoke(cli_app, ["db", "--database", "default", *command])
        assert result.exit_code == 1, result.output
        assert message in result.output


def test_demo_seeders_never_run_in_production(monkeypatch):
    from app.db.seeders import SeederError, select_seeders

    try:
        select_seeders(None, "production")
    except SeederError as exc:
        assert "Not allowed in production" in str(exc)
    else:
        raise AssertionError("demo seeders must be blocked in production")


def test_test_target_must_be_a_test_database(cli, monkeypatch):
    monkeypatch.setattr(settings, "test_database_url", settings.database_url)
    result = cli("status")
    assert result.exit_code == 1
    assert "Refusing to use 'kawika' as the test database" in result.output


def test_unreachable_database_is_reported_plainly(cli, monkeypatch):
    monkeypatch.setattr(
        settings, "test_database_url", "postgresql+psycopg://kawika:wrong@127.0.0.1:1/kawika_test"
    )
    result = cli("status")
    assert result.exit_code == 1
    assert "Can't connect to kawika@127.0.0.1:1/kawika_test" in result.output
    assert "wrong" not in result.output
    assert "Traceback" not in result.output


def test_help_lists_every_command():
    from typer.testing import CliRunner

    from app.cli.main import app as cli_app

    result = CliRunner().invoke(cli_app, ["db", "--help"])
    assert result.exit_code == 0
    for name in ("migrate", "fresh", "seed", "status", "rollback", "reset", "make-migration", "check"):
        assert name in result.output
