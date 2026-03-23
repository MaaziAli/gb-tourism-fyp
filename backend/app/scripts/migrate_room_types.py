import sys, os
sys.path.insert(0, os.path.dirname(
    os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)))))
import sqlite3
from pathlib import Path


def run():
    db_path = (
        Path(__file__).parent.parent.parent
        / "db.sqlite3"
    )
    conn = sqlite3.connect(str(db_path))
    c = conn.cursor()

    c.execute("PRAGMA table_info(room_types)")
    cols = [r[1] for r in c.fetchall()]

    extras = {
        "description": "TEXT",
        "bed_type": "TEXT",
        "amenities": "TEXT",
        "available_count": "INTEGER DEFAULT 5"
    }
    for col, defn in extras.items():
        if col not in cols:
            c.execute(
                f"ALTER TABLE room_types "
                f"ADD COLUMN {col} {defn}"
            )
            print(f"[OK] Added room_types.{col}")

    conn.commit()
    conn.close()
    print("[DONE] Room types migration complete")


if __name__ == "__main__":
    run()
