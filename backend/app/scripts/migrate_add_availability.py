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
    if "availability_blocks" not in tables:
        cursor.execute("""
            CREATE TABLE availability_blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL
                    REFERENCES listings(id),
                block_date TEXT NOT NULL,
                reason TEXT DEFAULT 'blocked',
                is_manual INTEGER DEFAULT 1
            )
        """)
        print("availability_blocks table created!")
    conn.commit()
    conn.close()
    print("Done!")


if __name__ == "__main__":
    run()
