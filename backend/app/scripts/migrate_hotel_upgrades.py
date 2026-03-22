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

    cursor.execute("PRAGMA table_info(listings)")
    listing_cols = [r[1] for r in cursor.fetchall()]
    listing_new = {
        "cancellation_policy": "TEXT DEFAULT 'moderate'",
        "cancellation_hours_free": "INTEGER DEFAULT 48",
        "rooms_available": "INTEGER DEFAULT 10",
    }
    for col, defn in listing_new.items():
        if col not in listing_cols:
            cursor.execute(
                f"ALTER TABLE listings ADD COLUMN {col} {defn}"
            )
            print(f"listings.{col} added")

    cursor.execute("PRAGMA table_info(reviews)")
    review_cols = [r[1] for r in cursor.fetchall()]
    review_new = {
        "cleanliness_rating": "REAL DEFAULT 0",
        "location_rating": "REAL DEFAULT 0",
        "value_rating": "REAL DEFAULT 0",
        "staff_rating": "REAL DEFAULT 0",
        "facilities_rating": "REAL DEFAULT 0",
        "review_photos": "TEXT",
        "provider_reply": "TEXT",
        "provider_reply_at": "TIMESTAMP",
    }
    for col, defn in review_new.items():
        if col not in review_cols:
            cursor.execute(
                f"ALTER TABLE reviews ADD COLUMN {col} {defn}"
            )
            print(f"reviews.{col} added")

    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = [r[0] for r in cursor.fetchall()]

    if "messages" not in tables:
        cursor.execute(
            """
            CREATE TABLE messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER REFERENCES bookings(id),
                listing_id INTEGER REFERENCES listings(id),
                sender_id INTEGER NOT NULL REFERENCES users(id),
                receiver_id INTEGER NOT NULL REFERENCES users(id),
                message TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        print("messages table created!")

    if "recently_viewed" not in tables:
        cursor.execute(
            """
            CREATE TABLE recently_viewed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                listing_id INTEGER NOT NULL REFERENCES listings(id),
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, listing_id)
            )
            """
        )
        print("recently_viewed table created!")

    conn.commit()
    conn.close()
    print("Hotel upgrades migration done!")


if __name__ == "__main__":
    run()
