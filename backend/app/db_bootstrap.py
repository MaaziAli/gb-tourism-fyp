"""
SQLite schema compatibility helpers.

This module applies safe, idempotent ALTER TABLE statements for columns that
exist in current SQLAlchemy models but may be missing in older local databases.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Iterable


def _resolve_sqlite_db_path(database_url: str) -> Path | None:
    """
    Resolve sqlite:/// URLs into a filesystem path.

    Supports:
    - sqlite:///./db.sqlite3
    - sqlite:////absolute/path/db.sqlite3
    """
    if not database_url.startswith("sqlite:///"):
        return None

    raw_path = database_url.replace("sqlite:///", "", 1)
    return Path(raw_path).resolve()


def _ensure_columns(
    conn: sqlite3.Connection,
    table_name: str,
    required_columns: Iterable[tuple[str, str]],
) -> list[str]:
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    existing = {row[1] for row in cursor.fetchall()}

    added: list[str] = []
    for col_name, col_def in required_columns:
        if col_name in existing:
            continue
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def}")
        added.append(f"{table_name}.{col_name}")
    return added


def ensure_sqlite_schema_compat(database_url: str) -> list[str]:
    """
    Apply minimal schema upgrades for legacy sqlite databases.

    Returns a list of "table.column" entries that were added.
    """
    db_path = _resolve_sqlite_db_path(database_url)
    if db_path is None or not db_path.exists():
        return []

    conn = sqlite3.connect(str(db_path))
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cursor.fetchall()}

        added: list[str] = []

        if "listings" in tables:
            added.extend(
                _ensure_columns(
                    conn,
                    "listings",
                    (
                        ("max_capacity_per_day", "INTEGER"),
                        ("pickup_location", "TEXT"),
                        ("dropoff_location", "TEXT"),
                        ("pickup_time", "TEXT"),
                        ("dropoff_time", "TEXT"),
                        ("insurance_options", "JSON"),
                        ("fuel_policy", "TEXT DEFAULT 'full_to_full'"),
                        ("mileage_limit", "INTEGER"),
                    ),
                )
            )

        if "bookings" in tables:
            added.extend(
                _ensure_columns(
                    conn,
                    "bookings",
                    (
                        ("loyalty_points_used", "INTEGER DEFAULT 0 NOT NULL"),
                        ("loyalty_discount_applied", "REAL DEFAULT 0.0 NOT NULL"),
                        ("rental_details", "JSON"),
                    ),
                )
            )

        conn.commit()
        return added
    finally:
        conn.close()
