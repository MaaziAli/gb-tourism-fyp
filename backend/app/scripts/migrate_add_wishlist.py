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
    if "wishlists" not in tables:
        cursor.execute("""
            CREATE TABLE wishlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL
                    REFERENCES users(id),
                listing_id INTEGER NOT NULL
                    REFERENCES listings(id),
                created_at TIMESTAMP DEFAULT
                    CURRENT_TIMESTAMP,
                UNIQUE(user_id, listing_id)
            )
        """)
        print("wishlists table created!")
    conn.commit()
    conn.close()
    print("Done!")


if __name__ == "__main__":
    run()
