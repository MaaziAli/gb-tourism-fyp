CREATE TABLE IF NOT EXISTS payout_requests (
    id INTEGER PRIMARY KEY,
    provider_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,
    notes TEXT NULL,
    FOREIGN KEY (provider_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_provider_id
    ON payout_requests(provider_id);

CREATE INDEX IF NOT EXISTS idx_payout_requests_status
    ON payout_requests(status);

CREATE INDEX IF NOT EXISTS idx_payout_requests_requested_at
    ON payout_requests(requested_at);
