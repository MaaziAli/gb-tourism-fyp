-- Migration: add_webhook_events
-- Purpose : Create webhook_events table for idempotent webhook processing.
-- Run this script against existing databases that were created before
-- WebhookEvent was added to the ORM (Base.metadata.create_all handles
-- new databases automatically).
--
-- Usage (SQLite CLI):
--   sqlite3 backend/db.sqlite3 < backend/migrations/add_webhook_events.sql
--
-- Usage (Python one-liner):
--   python -c "
--   import sqlite3, pathlib
--   sql = pathlib.Path('backend/migrations/add_webhook_events.sql').read_text()
--   con = sqlite3.connect('backend/db.sqlite3')
--   con.executescript(sql)
--   con.close()
--   print('Done')
--   "

CREATE TABLE IF NOT EXISTS webhook_events (
    id           INTEGER   PRIMARY KEY AUTOINCREMENT,
    event_id     TEXT      NOT NULL UNIQUE,
    event_type   TEXT      NOT NULL,
    source       TEXT      NOT NULL DEFAULT 'unknown',
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
    ON webhook_events (event_id);
