import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))
import sqlite3
from pathlib import Path


def run():
    db_path = (
        Path(__file__).parent.parent.parent / "db.sqlite3"
    )
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = [r[0] for r in cursor.fetchall()]
    if "trip_plans" not in tables:
        cursor.execute("""
            CREATE TABLE trip_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL
                    REFERENCES users(id),
                title TEXT NOT NULL,
                destination TEXT NOT NULL,
                start_date TEXT,
                end_date TEXT,
                duration_days INTEGER NOT NULL,
                budget_tier TEXT NOT NULL,
                total_budget REAL NOT NULL,
                estimated_cost REAL DEFAULT 0,
                hotel_id INTEGER REFERENCES listings(id),
                transport_id INTEGER
                    REFERENCES listings(id),
                activities TEXT DEFAULT '[]',
                notes TEXT,
                is_public INTEGER DEFAULT 0,
                share_code TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT
                    CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        print("trip_plans table created!")
    else:
        print("trip_plans already exists")
    conn.close()
    print("Done!")


if __name__ == "__main__":
    run()
