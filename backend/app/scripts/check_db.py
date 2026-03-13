import os
import sys
from pathlib import Path
import sqlite3

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ),
)


def check_db():
    db_path = Path(__file__).parent.parent.parent / "db.sqlite3"
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"\n📊 Database tables: {tables}\n")

    for table in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        cols = cursor.fetchall()
        print(f"Table '{table}' columns:")
        for col in cols:
            name = col[1]
            col_type = col[2]
            not_null = bool(col[3])
            null_text = "NOT NULL" if not_null else "nullable"
            print(f"  - {name} ({col_type}) {null_text}")
        print()

    conn.close()


if __name__ == "__main__":
    check_db()

