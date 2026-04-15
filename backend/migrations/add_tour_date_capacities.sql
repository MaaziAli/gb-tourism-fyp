CREATE TABLE IF NOT EXISTS tour_date_capacities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tour_date DATE NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(listing_id, tour_date)
);

CREATE INDEX IF NOT EXISTS idx_tour_cap_listing_date
ON tour_date_capacities(listing_id, tour_date);
