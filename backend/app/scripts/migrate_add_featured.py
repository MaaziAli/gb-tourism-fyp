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
    cols = [r[1] for r in cursor.fetchall()]

    if "is_featured" not in cols:
        cursor.execute(
            """
            ALTER TABLE listings
            ADD COLUMN is_featured INTEGER DEFAULT 0
            """
        )
        print("Added is_featured to listings!")

    conn.commit()
    conn.close()
    print("Done!")


if __name__ == "__main__":
    run()
