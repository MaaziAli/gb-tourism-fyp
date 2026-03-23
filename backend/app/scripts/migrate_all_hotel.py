import sys, os
sys.path.insert(0, os.path.dirname(
    os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)))))
import sqlite3
from pathlib import Path


def run():
    db_path = (
        Path(__file__).parent.parent.parent
        / "db.sqlite3"
    )
    conn = sqlite3.connect(str(db_path))
    c = conn.cursor()

    def add_col(table, col, defn):
        c.execute(f"PRAGMA table_info({table})")
        cols = [r[1] for r in c.fetchall()]
        if col not in cols:
            c.execute(
                f"ALTER TABLE {table} "
                f"ADD COLUMN {col} {defn}"
            )
            print(f"[OK] {table}.{col}")
        else:
            print(f"[SKIP] {table}.{col} exists")

    # Listing upgrades
    add_col("listings",
        "cancellation_policy",
        "TEXT DEFAULT 'moderate'")
    add_col("listings",
        "cancellation_hours_free",
        "INTEGER DEFAULT 48")
    add_col("listings",
        "rooms_available",
        "INTEGER DEFAULT 10")
    add_col("listings",
        "is_featured",
        "INTEGER DEFAULT 0")

    # Review upgrades
    add_col("reviews",
        "cleanliness_rating",
        "REAL DEFAULT 0")
    add_col("reviews",
        "location_rating",
        "REAL DEFAULT 0")
    add_col("reviews",
        "value_rating",
        "REAL DEFAULT 0")
    add_col("reviews",
        "staff_rating",
        "REAL DEFAULT 0")
    add_col("reviews",
        "facilities_rating",
        "REAL DEFAULT 0")
    add_col("reviews",
        "provider_reply",
        "TEXT")
    add_col("reviews",
        "provider_reply_at",
        "TIMESTAMP")

    # Messages table
    c.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table'"
    )
    tables = [r[0] for r in c.fetchall()]

    if "messages" not in tables:
        c.execute("""
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
        print("[OK] messages table created")
    else:
        print("[SKIP] messages table exists")

    # Recently viewed table
    if "recently_viewed" not in tables:
        c.execute("""
            CREATE TABLE recently_viewed (
                id INTEGER PRIMARY KEY
                    AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                listing_id INTEGER NOT NULL,
                viewed_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("[OK] recently_viewed created")
    else:
        print("[SKIP] recently_viewed exists")

    conn.commit()
    conn.close()
    print("[DONE] All hotel migrations complete!")


if __name__ == "__main__":
    run()
