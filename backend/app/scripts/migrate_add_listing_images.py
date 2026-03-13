import sys
import os
import sqlite3
from pathlib import Path


sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ),
)


def run():
    db_path = Path(__file__).parent.parent.parent / "db.sqlite3"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = [r[0] for r in cursor.fetchall()]
    if "listing_images" not in tables:
        cursor.execute(
            """
            CREATE TABLE listing_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL 
                    REFERENCES listings(id),
                filename TEXT NOT NULL,
                caption TEXT,
                sort_order INTEGER DEFAULT 0
            )
        """
        )
        conn.commit()
        print("listing_images table created!")
    else:
        print("listing_images table already exists")
    conn.close()


if __name__ == "__main__":
    run()

