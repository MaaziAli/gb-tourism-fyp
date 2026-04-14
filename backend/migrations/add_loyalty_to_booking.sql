-- Migration: Add loyalty redemption fields to bookings table
-- Run once against the existing SQLite database file.
-- SQLAlchemy's create_all() will NOT add columns to an existing table,
-- so this script must be applied manually when upgrading a live DB.

-- ── Add loyalty_points_used column (default 0, not null) ────────────────
ALTER TABLE bookings ADD COLUMN loyalty_points_used    INTEGER NOT NULL DEFAULT 0;

-- ── Add loyalty_discount_applied column (default 0.0, not null) ─────────
ALTER TABLE bookings ADD COLUMN loyalty_discount_applied REAL    NOT NULL DEFAULT 0.0;

-- ── Verify ───────────────────────────────────────────────────────────────
-- SELECT name FROM pragma_table_info('bookings')
--   WHERE name IN ('loyalty_points_used', 'loyalty_discount_applied');
