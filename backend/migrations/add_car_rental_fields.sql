-- Migration: car-rental-specific fields for listings and bookings
-- Run once against the SQLite database file.

ALTER TABLE listings ADD COLUMN pickup_location TEXT;
ALTER TABLE listings ADD COLUMN dropoff_location TEXT;
ALTER TABLE listings ADD COLUMN pickup_time TEXT;
ALTER TABLE listings ADD COLUMN dropoff_time TEXT;
ALTER TABLE listings ADD COLUMN insurance_options TEXT;
ALTER TABLE listings ADD COLUMN fuel_policy TEXT DEFAULT 'full_to_full';
ALTER TABLE listings ADD COLUMN mileage_limit INTEGER;

ALTER TABLE bookings ADD COLUMN rental_details TEXT;
