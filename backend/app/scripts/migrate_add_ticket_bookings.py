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

    if "ticket_bookings" not in tables:
        cursor.execute("""
            CREATE TABLE ticket_bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL
                    REFERENCES events(id),
                ticket_type_id INTEGER NOT NULL
                    REFERENCES ticket_types(id),
                user_id INTEGER NOT NULL
                    REFERENCES users(id),
                quantity INTEGER DEFAULT 1,
                unit_price REAL DEFAULT 0,
                total_price REAL DEFAULT 0,
                platform_commission REAL DEFAULT 0,
                organizer_amount REAL DEFAULT 0,
                booking_ref TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'confirmed',
                payment_status TEXT DEFAULT 'unpaid',
                payment_method TEXT,
                card_last4 TEXT,
                transaction_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("ticket_bookings table created!")
    conn.commit()
    conn.close()
    print("Done!")


if __name__ == "__main__":
    run()
