CREATE TABLE IF NOT EXISTS listing_addons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    price_type TEXT DEFAULT 'per_night'
      CHECK (price_type IN ('per_night', 'per_person', 'per_booking')),
    is_optional INTEGER DEFAULT 1,
    max_quantity INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_listing_addons_listing_id
ON listing_addons (listing_id);

CREATE INDEX IF NOT EXISTS ix_listing_addons_room_type_id
ON listing_addons (room_type_id);
