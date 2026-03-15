import os
import sqlite3
import sys
from pathlib import Path

sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
)


def run():
    db_path = Path(__file__).parent.parent.parent / "db.sqlite3"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]

    if "events" not in tables:
        cursor.execute("""
            CREATE TABLE events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                organizer_id INTEGER NOT NULL
                    REFERENCES users(id),
                title TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                venue TEXT NOT NULL,
                location TEXT NOT NULL,
                event_date TEXT NOT NULL,
                event_time TEXT NOT NULL,
                end_time TEXT,
                image_url TEXT,
                total_capacity INTEGER DEFAULT 100,
                is_free INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                is_featured INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("events table created!")

    if "ticket_types" not in tables:
        cursor.execute("""
            CREATE TABLE ticket_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL
                    REFERENCES events(id),
                name TEXT NOT NULL,
                description TEXT,
                price REAL DEFAULT 0,
                capacity INTEGER DEFAULT 50,
                sold_count INTEGER DEFAULT 0,
                is_free INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1
            )
        """)
        print("ticket_types table created!")

    conn.commit()
    conn.close()
    print("Events migration complete!")


if __name__ == "__main__":
    run()
