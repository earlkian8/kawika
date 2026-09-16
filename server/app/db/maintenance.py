"""Low-level database maintenance used by the `kawika db` commands."""

from dataclasses import dataclass, field

from sqlalchemy import Engine, inspect, make_url, text


@dataclass
class DropReport:
    tables: list[str] = field(default_factory=list)
    views: list[str] = field(default_factory=list)
    sequences: list[str] = field(default_factory=list)
    types: list[str] = field(default_factory=list)

    @property
    def total(self) -> int:
        return len(self.tables) + len(self.views) + len(self.sequences) + len(self.types)


class DatabaseBusyError(RuntimeError):
    """Another connection holds a lock on an object that needs to be dropped."""


def describe_url(url: str) -> str:
    """`user@host:port/database` with the password removed."""
    parsed = make_url(url)
    port = f":{parsed.port}" if parsed.port else ""
    return f"{parsed.username}@{parsed.host}{port}/{parsed.database}"


def database_name(url: str) -> str:
    return make_url(url).database or ""


def drop_all_objects(engine: Engine, *, lock_timeout: str = "5s") -> DropReport:
    """Drop every view, table, sequence, and enum type in the default schema.

    Unlike `alembic downgrade base`, this also removes objects no migration
    knows about (including `alembic_version`), so the database is truly empty.
    Runs in one transaction: either everything is dropped or nothing is.
    """
    report = DropReport()
    with engine.begin() as connection:
        connection.execute(text(f"SET LOCAL lock_timeout = '{lock_timeout}'"))
        inspector = inspect(connection)
        quote = connection.dialect.identifier_preparer.quote

        def drop(kind: str, names: list[str], bucket: list[str]) -> None:
            for name in names:
                connection.execute(text(f"DROP {kind} IF EXISTS {quote(name)} CASCADE"))
                bucket.append(name)

        try:
            drop("VIEW", inspector.get_view_names(), report.views)
            drop("MATERIALIZED VIEW", inspector.get_materialized_view_names(), report.views)
            drop("TABLE", inspector.get_table_names(), report.tables)
            drop("SEQUENCE", inspector.get_sequence_names(), report.sequences)
            drop("TYPE", [enum["name"] for enum in inspector.get_enums()], report.types)
        except Exception as exc:
            if "lock timeout" in str(exc):
                raise DatabaseBusyError(
                    "Tables are locked by another connection. Stop running API servers or open "
                    "database sessions and try again."
                ) from exc
            raise
    return report


def table_row_counts(engine: Engine) -> dict[str, int]:
    """Exact row counts for every table in the default schema."""
    with engine.connect() as connection:
        quote = connection.dialect.identifier_preparer.quote
        return {
            name: connection.execute(text(f"SELECT count(*) FROM {quote(name)}")).scalar_one()
            for name in sorted(inspect(connection).get_table_names())
        }
