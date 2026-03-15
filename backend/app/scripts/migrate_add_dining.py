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

    if "dining_packages" not in tables:
        cursor.execute("""
            CREATE TABLE dining_packages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL
                    REFERENCES listings(id),
                name TEXT NOT NULL,
                description TEXT,
                package_type TEXT NOT NULL,
                price_per_person REAL NOT NULL,
                min_persons INTEGER DEFAULT 1,
                max_persons INTEGER DEFAULT 10,
                duration_hours REAL DEFAULT 2.0,
                is_available INTEGER DEFAULT 1
            )
        """)
        print("dining_packages table created!")

    if "table_reservations" not in tables:
        cursor.execute("""
            CREATE TABLE table_reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL
                    REFERENCES listings(id),
                user_id INTEGER NOT NULL
                    REFERENCES users(id),
                package_id INTEGER
                    REFERENCES dining_packages(id),
                package_name TEXT,
                reservation_date TEXT NOT NULL,
                reservation_time TEXT NOT NULL,
                persons INTEGER DEFAULT 2,
                total_price REAL DEFAULT 0,
                special_requests TEXT,
                status TEXT DEFAULT 'confirmed',
                payment_status TEXT DEFAULT 'unpaid',
                created_at TIMESTAMP DEFAULT
                    CURRENT_TIMESTAMP
            )
        """)
        print("table_reservations table created!")

    conn.commit()
    conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    run()
