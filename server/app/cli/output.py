"""Console helpers so every command reports in the same style."""

from typing import NoReturn

import typer
from rich.console import Console


def console() -> Console:
    # Created per call so output goes to whatever stdout is active (tests swap it).
    return Console(highlight=False, soft_wrap=True)


def success(message: str) -> None:
    console().print(f"[green]✓[/green] {message}")


def info(message: str) -> None:
    console().print(f"[dim]•[/dim] {message}")


def warn(message: str) -> None:
    console().print(f"[yellow]![/yellow] {message}")


def fail(message: str, *, hint: str | None = None, code: int = 1) -> NoReturn:
    out = console()
    out.print(f"[red]✗[/red] {message}")
    if hint:
        out.print(f"  [dim]{hint}[/dim]")
    raise typer.Exit(code)
