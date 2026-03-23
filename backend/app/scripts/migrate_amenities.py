import sys
import os
import sqlite3
from pathlib import Path

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__)
            )
        )
    )
)


def run():
    db_path = Path(__file__).parent.parent.parent / "db.sqlite3"
    conn = sqlite3.connect(str(db_path))
    c = conn.cursor()

    c.execute("PRAGMA table_info(listings)")
    cols = [r[1] for r in c.fetchall()]

    if "amenities" not in cols:
        c.execute(
            "ALTER TABLE listings ADD COLUMN amenities TEXT"
        )
        print("[OK] listings.amenities added")
    else:
        print("[SKIP] amenities already exists")

    conn.commit()
    conn.close()
    print("[DONE]")


if __name__ == "__main__":
    run()

