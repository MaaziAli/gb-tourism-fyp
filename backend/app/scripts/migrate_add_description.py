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


def run_migration():
    # Find the database file
    db_path = Path(__file__).parent.parent.parent / "db.sqlite3"

    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(listings)")
    columns = [row[1] for row in cursor.fetchall()]

    if "description" in columns:
        print("✅ Column 'description' already exists. No migration needed.")
        conn.close()
        return

    # Add the column
    cursor.execute("ALTER TABLE listings ADD COLUMN description TEXT")
    conn.commit()
    print("✅ Successfully added 'description' column to listings table!")

    # Verify
    cursor.execute("PRAGMA table_info(listings)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Current columns: {columns}")

    conn.close()


if __name__ == "__main__":
    run_migration()

