# Management CLI (`kawika`)

FastAPI has no built-in management commands, so Kawika ships its own CLI. It is built with [Typer](https://typer.tiangolo.com/) (from FastAPI's author) on top of Alembic. It fills the role of Laravel's `artisan migrate` / `migrate:fresh` / `db:seed` or Django's `manage.py`.

```bash
cd server
source .venv/bin/activate
pip install -r requirements-dev.txt   # installs the `kawika` command (editable)

kawika db migrate          # apply pending migrations
kawika db fresh --seed     # wipe, rebuild, and fill with demo data
kawika db seed             # add demo data (safe to repeat)
```

`python -m app.cli ...` works the same if the package is not installed.

## Commands

| Command | What it does | Laravel equivalent |
| ------- | ------------ | ------------------ |
| `kawika db migrate` | Apply pending migrations. `--to <rev>` stops at a revision. `--seed` seeds afterwards. | `migrate` |
| `kawika db fresh` | Drop **every** table, view, sequence, and enum type (including ones no migration created), then migrate from scratch. `--seed` and `--learners N` fill it afterwards. | `migrate:fresh` |
| `kawika db seed` | Run seeders. Existing rows are skipped, so it is safe to repeat. `--seeder/-s NAME` (repeatable) and `--learners N` (0–1000). | `db:seed` |
| `kawika db status` | Applied and pending migrations, plus row counts per table. | `migrate:status` |
| `kawika db rollback` | Undo the last migration. `--steps N` undoes more. | `migrate:rollback` |
| `kawika db reset` | Undo every migration by running each downgrade. | `migrate:reset` |
| `kawika db make-migration "message"` | Autogenerate a migration from model changes. Refuses when nothing changed. `--empty` creates a blank one for data migrations. | `make:migration` |
| `kawika db check` | Exit non-zero if models have changes without a migration (for CI). | – |

Every command accepts `--help`.

### Choosing the database

```bash
kawika db status                  # DATABASE_URL (kawika)
kawika db --database test status  # TEST_DATABASE_URL (kawika_test), short form: -d test
```

`--database` goes **before** the command name. With `APP_ENV=test` the default switches to the test database. The test target must be a database whose name ends in `_test`.

`fresh` vs `reset`: `reset` runs every migration's `downgrade()`, which tests that your downgrades work. `fresh` ignores downgrades and empties the schema directly, so it still works when a downgrade is broken or someone created tables by hand. Reach for `fresh` when you "just want a clean database".

## Safety

| Guard | Behaviour |
| ----- | --------- |
| Confirmation | `fresh`, `rollback`, and `reset` ask before changing anything. Add `--force` (`-f`) to skip the prompt. Without a terminal (CI, scripts, pipes) they refuse unless `--force` is given. |
| Production | With `APP_ENV=production`, destructive commands refuse the default database without `--force`, before any connection is opened. |
| Demo data | Demo and sample-learner seeders never run in production, even with `--force`. |
| Test database | `--database test` refuses any database whose name does not end in `_test`. |
| Busy database | `fresh` waits at most 5 seconds for table locks, then stops without dropping anything, asking you to stop running API servers. The drop runs in a single transaction. |
| Credentials | Output shows `user@host:port/database` only. The password is never printed, and tracebacks never show local variables. |

## Seed data

| Seeder | Creates | Login |
| ------ | ------- | ----- |
| `demo-accounts` | `demo` (Juan dela Cruz) and `demo_mentor` (Maria Clara Santos) | password `tara matuto ng senyas` |
| `learners` | `--learners N` sample learners (default 12) with common Filipino names, e.g. `juan_santos_01` | password `sample learner passphrase` |

- Emails use `example.com`, a domain reserved so it never receives real mail.
- Data is **deterministic**: a fixed random seed means `fresh --seed` always produces the same learners, which keeps screenshots and bug reports reproducible.
- Seeders are **idempotent**. Raising `--learners` from 12 to 20 adds only the 8 new learners.
- These credentials are for local development only.

### Adding a seeder

1. Create a class in `app/db/seeders/` that subclasses `Seeder`:

   ```python
   class BadgeSeeder(Seeder):
       name = "badges"
       description = "Starter badges"
       environments = frozenset({"development", "test", "production"})  # reference data may run everywhere

       def run(self) -> SeedResult:
           result = SeedResult()
           ...  # skip rows that already exist, add the rest
           return result
   ```

2. Register it in `SEEDERS` in `app/db/seeders/__init__.py`, after any seeder it depends on.
3. Add a test in `tests/cli/test_db_commands.py` that seeds twice and expects nothing new the second time.

For generated records, add builders to `app/db/factories.py` so tests can reuse them.

## Everyday recipes

| I want to… | Run |
| ---------- | --- |
| Start over with a clean, populated database | `kawika db fresh --seed` |
| Pull teammates' schema changes | `kawika db migrate` |
| Change a model | Edit `app/models/`, then `kawika db make-migration "add badges"`, read the generated file, then `kawika db migrate` |
| Undo my last migration while developing | `kawika db rollback` |
| Reset the test database by hand | `kawika db -d test fresh --force` |
| Guard CI against forgotten migrations | `kawika db check` |

## Where the code lives

| Path | Role |
| ---- | ---- |
| `app/cli/main.py` | Root `kawika` app (`--version`, command groups) |
| `app/cli/db.py` | The `db` commands, guards, and output |
| `app/cli/output.py` | Shared console formatting |
| `app/db/migrations.py` | Alembic config, migration state, and upgrade/downgrade helpers |
| `app/db/maintenance.py` | Dropping all objects, row counts, safe URL display |
| `app/db/seeders/` | `Seeder` base class, registry, and user seeders |
| `app/db/factories.py` | Deterministic Filipino learner profiles |
| `pyproject.toml` | Registers the `kawika` console script |
