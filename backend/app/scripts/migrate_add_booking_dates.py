import sys
import os
import sqlite3
from pathlib import Path


# Ensure project root is on sys.path
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

  cursor.execute("PRAGMA table_info(bookings)")
  columns = [row[1] for row in cursor.fetchall()]

  if "check_in" not in columns:
    cursor.execute(
      "ALTER TABLE bookings ADD COLUMN check_in DATE"
    )
    print("Added check_in column")
  else:
    print("check_in already exists")

  if "check_out" not in columns:
    cursor.execute(
      "ALTER TABLE bookings ADD COLUMN check_out DATE"
    )
    print("Added check_out column")
  else:
    print("check_out already exists")

  if "status" not in columns:
    cursor.execute(
      "ALTER TABLE bookings ADD COLUMN "
      "status TEXT DEFAULT 'active'"
    )
    print("Added status column")
  else:
    print("status already exists")

  if "total_price" not in columns:
    cursor.execute(
      "ALTER TABLE bookings ADD COLUMN "
      "total_price REAL DEFAULT 0"
    )
    print("Added total_price column")
  else:
    print("total_price already exists")

  conn.commit()
  conn.close()
  print("Migration complete!")


if __name__ == "__main__":
  run()

