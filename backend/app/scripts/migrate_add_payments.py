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

    # Create payments table
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = [r[0] for r in cursor.fetchall()]

    if "payments" not in tables:
        cursor.execute("""
            CREATE TABLE payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL
                    REFERENCES bookings(id),
                user_id INTEGER NOT NULL
                    REFERENCES users(id),
                amount REAL NOT NULL,
                platform_commission REAL NOT NULL,
                provider_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                payment_method TEXT DEFAULT 'card',
                card_last4 TEXT,
                transaction_id TEXT,
                created_at TIMESTAMP DEFAULT
                    CURRENT_TIMESTAMP
            )
        """)
        print("payments table created!")
    else:
        print("payments already exists")

    # Add payment_status to bookings
    cursor.execute("PRAGMA table_info(bookings)")
    cols = [r[1] for r in cursor.fetchall()]
    if "payment_status" not in cols:
        cursor.execute(
            "ALTER TABLE bookings ADD COLUMN "
            "payment_status TEXT DEFAULT 'unpaid'"
        )
        print("Added payment_status to bookings")

    conn.commit()
    conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    run()
