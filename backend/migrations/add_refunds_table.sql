-- Migration: Add refunds table and extend booking payment_status values
-- Run once against the SQLite database file (gb_tourism.db or similar).
-- SQLite ALTER TABLE is limited, so new enum values for payment_status
-- are handled purely at the application level (stored as plain strings).

-- ── 1. Create refunds table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id      INTEGER NOT NULL REFERENCES bookings(id),
    payment_id      INTEGER REFERENCES payments(id),
    amount_refunded REAL    NOT NULL,
    refund_reason   TEXT,
    refunded_at     DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- ── 2. Index for fast lookup by booking ─────────────────────────────────
CREATE INDEX IF NOT EXISTS ix_refunds_booking_id ON refunds (booking_id);
CREATE INDEX IF NOT EXISTS ix_refunds_id         ON refunds (id);

-- ── Notes ────────────────────────────────────────────────────────────────
-- The bookings.payment_status column already exists (type TEXT / String).
-- New values written by the application:
--   'refunded'            – full refund processed
--   'partially_refunded'  – 50% refund processed
--   'paid'                – booking cancelled, no refund (provider keeps payment)
-- No ALTER TABLE is needed for SQLite TEXT columns.
