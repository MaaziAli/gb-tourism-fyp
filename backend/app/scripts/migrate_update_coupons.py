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

    cursor.execute("PRAGMA table_info(coupons)")
    cols = [r[1] for r in cursor.fetchall()]

    new_cols = {
        "is_stackable": "INTEGER DEFAULT 1",
        "influencer_name": "TEXT",
        "tier": "TEXT DEFAULT 'standard'",
    }

    for col, definition in new_cols.items():
        if col not in cols:
            cursor.execute(
                f"ALTER TABLE coupons ADD COLUMN {col} {definition}"
            )
            print(f"Added: {col}")

    conn.commit()
    conn.close()
    print("Coupon update migration done!")


if __name__ == "__main__":
    run()
