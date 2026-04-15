-- Migration: add seasonal_prices table
-- Run once against the existing SQLite database.
-- SQLAlchemy's create_all() will also handle this on first startup after
-- the model is imported, so this script is provided for manual / CI use.

CREATE TABLE IF NOT EXISTS seasonal_prices (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id       INTEGER NOT NULL
                         REFERENCES listings(id) ON DELETE CASCADE,
    name             TEXT    NOT NULL,
    start_date       DATE    NOT NULL,
    end_date         DATE    NOT NULL,
    price_multiplier REAL    NOT NULL DEFAULT 1.0,
    fixed_surcharge  REAL    NOT NULL DEFAULT 0.0,
    is_active        INTEGER NOT NULL DEFAULT 1,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seasonal_prices_listing
    ON seasonal_prices(listing_id);
