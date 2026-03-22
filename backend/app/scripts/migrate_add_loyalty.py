import os
import sqlite3
import sys
from pathlib import Path


def run():
    sys.path.insert(
        0,
        os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ),
    )
    db_path = Path(__file__).resolve().parent.parent.parent / "db.sqlite3"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'",
    )
    tables = [r[0] for r in cursor.fetchall()]

    if "loyalty_accounts" not in tables:
        cursor.execute(
            """
            CREATE TABLE loyalty_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL
                    REFERENCES users(id),
                total_points INTEGER DEFAULT 0,
                lifetime_points INTEGER DEFAULT 0,
                tier TEXT DEFAULT 'bronze',
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        print("loyalty_accounts created!")

    if "loyalty_transactions" not in tables:
        cursor.execute(
            """
            CREATE TABLE loyalty_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL
                    REFERENCES users(id),
                points INTEGER NOT NULL,
                transaction_type TEXT NOT NULL,
                description TEXT NOT NULL,
                reference_id INTEGER,
                balance_after INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        print("loyalty_transactions created!")

    conn.commit()
    conn.close()
    print("Loyalty migration complete!")


if __name__ == "__main__":
    run()
