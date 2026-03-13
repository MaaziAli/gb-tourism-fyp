import sys
import os

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ),
)

import sqlite3
from pathlib import Path


def run():
    db_path = Path(__file__).parent.parent.parent / "db.sqlite3"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Create room_types table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]

    if "room_types" not in tables:
        cursor.execute(
            """
            CREATE TABLE room_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL 
                    REFERENCES listings(id),
                name TEXT NOT NULL,
                description TEXT,
                price_per_night REAL NOT NULL,
                capacity INTEGER DEFAULT 2,
                total_rooms INTEGER DEFAULT 1
            )
        """
        )
        print("room_types table created!")
    else:
        print("room_types already exists")

    # Add room_type_id / room_type_name to bookings
    cursor.execute("PRAGMA table_info(bookings)")
    cols = [r[1] for r in cursor.fetchall()]

    if "room_type_id" not in cols:
        cursor.execute(
            "ALTER TABLE bookings ADD COLUMN " "room_type_id INTEGER"
        )
        print("Added room_type_id to bookings")

    if "room_type_name" not in cols:
        cursor.execute(
            "ALTER TABLE bookings ADD COLUMN " "room_type_name TEXT"
        )
        print("Added room_type_name to bookings")

    conn.commit()
    conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    run()

