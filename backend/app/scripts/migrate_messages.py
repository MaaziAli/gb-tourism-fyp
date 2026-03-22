import os
import sqlite3
import sys
from pathlib import Path


def run():
    # backend/db.sqlite3 (scripts -> app -> backend)
    db_path = (
        Path(__file__).resolve().parent.parent.parent
        / "db.sqlite3"
    )
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table'"
    )
    tables = [r[0] for r in cursor.fetchall()]

    if "messages" not in tables:
        cursor.execute("""
            CREATE TABLE messages (
                id INTEGER PRIMARY KEY
                    AUTOINCREMENT,
                booking_id INTEGER,
                listing_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("[OK] messages table created!")
    else:
        print("[OK] messages table already exists")

    if "recently_viewed" not in tables:
        cursor.execute("""
            CREATE TABLE recently_viewed (
                id INTEGER PRIMARY KEY
                    AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                listing_id INTEGER NOT NULL,
                viewed_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("[OK] recently_viewed table created!")
    else:
        print("[OK] recently_viewed exists")

    cursor.execute("PRAGMA table_info(listings)")
    listing_cols = [
        r[1] for r in cursor.fetchall()
    ]
    new_listing_cols = {
        "cancellation_policy":
            "TEXT DEFAULT 'moderate'",
        "cancellation_hours_free":
            "INTEGER DEFAULT 48",
        "rooms_available": "INTEGER DEFAULT 10",
        "is_featured": "INTEGER DEFAULT 0"
    }
    for col, defn in new_listing_cols.items():
        if col not in listing_cols:
            cursor.execute(
                f"ALTER TABLE listings "
                f"ADD COLUMN {col} {defn}"
            )
            print(f"✅ listings.{col} added")

    cursor.execute("PRAGMA table_info(reviews)")
    review_cols = [
        r[1] for r in cursor.fetchall()
    ]
    new_review_cols = {
        "cleanliness_rating": "REAL DEFAULT 0",
        "location_rating": "REAL DEFAULT 0",
        "value_rating": "REAL DEFAULT 0",
        "staff_rating": "REAL DEFAULT 0",
        "facilities_rating": "REAL DEFAULT 0",
        "provider_reply": "TEXT",
        "provider_reply_at": "TIMESTAMP"
    }
    for col, defn in new_review_cols.items():
        if col not in review_cols:
            cursor.execute(
                f"ALTER TABLE reviews "
                f"ADD COLUMN {col} {defn}"
            )
            print(f"[OK] reviews.{col} added")

    conn.commit()
    conn.close()
    print("\n[OK] All migrations done!")
    print("Restart the backend now.")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(
        os.path.dirname(os.path.dirname(
            os.path.abspath(__file__)))))
    run()
