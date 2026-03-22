import sqlite3
from pathlib import Path


def run():
    db_path = (
        Path(__file__).parent.parent.parent
        / "db.sqlite3"
    )
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(bookings)")
    existing_cols = [
        row[1] for row in cursor.fetchall()
    ]

    new_cols = {
        "group_size": "INTEGER DEFAULT 1",
        "is_group_booking": "INTEGER DEFAULT 0",
        "group_lead_name": "TEXT",
        "group_discount_applied": "REAL DEFAULT 0",
        "price_per_person": "REAL",
        "special_requirements": "TEXT",
    }

    for col, definition in new_cols.items():
        if col not in existing_cols:
            cursor.execute(
                f"ALTER TABLE bookings "
                f"ADD COLUMN {col} {definition}"
            )
            print(f"Added column: {col}")
        else:
            print(f"Column exists: {col}")

    conn.commit()
    conn.close()
    print("Group booking migration complete!")


if __name__ == "__main__":
    run()
