import sqlite3
from pathlib import Path


def run():
    db_path = (
        Path(__file__).parent.parent.parent
        / "db.sqlite3"
    )
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table'"
    )
    tables = [r[0] for r in cursor.fetchall()]

    if "coupons" not in tables:
        cursor.execute("""
            CREATE TABLE coupons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_by INTEGER NOT NULL
                    REFERENCES users(id),
                listing_id INTEGER
                    REFERENCES listings(id),
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
                created_at TIMESTAMP DEFAULT
                    CURRENT_TIMESTAMP
            )
        """)
        print("coupons table created!")

    if "coupon_usages" not in tables:
        cursor.execute("""
            CREATE TABLE coupon_usages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                coupon_id INTEGER NOT NULL
                    REFERENCES coupons(id),
                user_id INTEGER NOT NULL
                    REFERENCES users(id),
                booking_id INTEGER,
                discount_applied REAL DEFAULT 0,
                used_at TIMESTAMP DEFAULT
                    CURRENT_TIMESTAMP
            )
        """)
        print("coupon_usages table created!")

    conn.commit()
    conn.close()
    print("Coupon migration complete!")


if __name__ == "__main__":
    run()
