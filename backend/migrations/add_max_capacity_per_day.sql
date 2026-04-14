-- Migration: add max_capacity_per_day to listings
-- Run once against the SQLite database file.
ALTER TABLE listings ADD COLUMN max_capacity_per_day INTEGER DEFAULT NULL;
