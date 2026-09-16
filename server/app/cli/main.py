"""The `kawika` command-line interface.

Run `kawika --help` (after `pip install -e .`) or `python -m app.cli --help`.
"""

from importlib.metadata import PackageNotFoundError, version
from typing import Annotated

import typer

from app.cli import db

app = typer.Typer(
    name="kawika",
    help="Kawika management commands.",
    no_args_is_help=True,
    rich_markup_mode="rich",
    pretty_exceptions_show_locals=False,  # never print settings such as DATABASE_URL
)
app.add_typer(db.app)


def _version(value: bool) -> None:
    if value:
        try:
            typer.echo(f"kawika {version('kawika-server')}")
        except PackageNotFoundError:
            typer.echo("kawika (not installed; run `pip install -e .`)")
        raise typer.Exit()


@app.callback()
def main(
    _version_flag: Annotated[
        bool, typer.Option("--version", callback=_version, is_eager=True, help="Show the version and exit.")
    ] = False,
) -> None:
    """Kawika management commands."""


def run() -> None:
    app()
