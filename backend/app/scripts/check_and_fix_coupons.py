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
    db_path = (
        Path(__file__).parent.parent.parent / "db.sqlite3"
    )
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = [r[0] for r in cursor.fetchall()]
    print("Existing tables:", tables)

    if "coupons" not in tables:
        cursor.execute("""
            CREATE TABLE coupons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_by INTEGER NOT NULL REFERENCES users(id),
                listing_id INTEGER REFERENCES listings(id),
                code TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                discount_type TEXT NOT NULL,
                discount_value REAL NOT NULL,
                min_booking_amount REAL DEFAULT 0,
                max_discount_amount REAL,
                max_uses INTEGER,
                used_count INTEGER DEFAULT 0,
                max_uses_per_user INTEGER DEFAULT 1,
                valid_from TEXT,
                valid_until TEXT,
                is_active INTEGER DEFAULT 1,
                is_public INTEGER DEFAULT 1,
                coupon_type TEXT DEFAULT 'general',
                is_stackable INTEGER DEFAULT 0,
                influencer_name TEXT,
                tier TEXT DEFAULT 'standard',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("[OK] coupons table CREATED!")
    else:
        print("[OK] coupons table exists")

        cursor.execute("PRAGMA table_info(coupons)")
        cols = [r[1] for r in cursor.fetchall()]
        print("Columns:", cols)

        missing = {
            "is_stackable": "INTEGER DEFAULT 0",
            "influencer_name": "TEXT",
            "tier": "TEXT DEFAULT 'standard'",
        }
        for col, defn in missing.items():
            if col not in cols:
                cursor.execute(
                    f"ALTER TABLE coupons ADD COLUMN {col} {defn}"
                )
                print(f"Added column: {col}")

    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = [r[0] for r in cursor.fetchall()]

    if "coupon_usages" not in tables:
        cursor.execute("""
            CREATE TABLE coupon_usages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                coupon_id INTEGER NOT NULL REFERENCES coupons(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                booking_id INTEGER,
                discount_applied REAL DEFAULT 0,
                used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("[OK] coupon_usages table CREATED!")
    else:
        print("[OK] coupon_usages table exists")

    conn.commit()
    conn.close()
    print("\nAll done! Restart the backend now.")


if __name__ == "__main__":
    run()
