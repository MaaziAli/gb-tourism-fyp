CREATE TABLE IF NOT EXISTS room_holds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id),
    booking_id INTEGER REFERENCES bookings(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    hold_expires_at DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_room_holds_room_type_id ON room_holds(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_holds_hold_expires_at ON room_holds(hold_expires_at);
