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
    db_path = Path(__file__).resolve().parent.parent.parent / "db.sqlite3"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(coupons)")
    cols = [r[1] for r in cursor.fetchall()]

    new_cols = {
        "scope": "TEXT DEFAULT 'provider'",
        "provider_id": "INTEGER",
    }
    for col, defn in new_cols.items():
        if col not in cols:
            cursor.execute(
                f"ALTER TABLE coupons ADD COLUMN {col} {defn}"
            )
            print(f"Added: {col}")

    cursor.execute(
        """
        UPDATE coupons
        SET provider_id = created_by
        WHERE provider_id IS NULL
        """
    )

    cursor.execute(
        """
        UPDATE coupons SET scope = 'all'
        WHERE created_by IN (
            SELECT id FROM users
            WHERE role = 'admin'
        )
        """
    )

    cursor.execute(
        """
        UPDATE coupons SET scope = 'provider'
        WHERE created_by IN (
            SELECT id FROM users
            WHERE role = 'provider'
        ) AND listing_id IS NULL
        """
    )

    cursor.execute(
        """
        UPDATE coupons SET scope = 'listing'
        WHERE listing_id IS NOT NULL
        """
    )

    conn.commit()
    conn.close()
    print("Coupon scope migration done!")


if __name__ == "__main__":
    run()
