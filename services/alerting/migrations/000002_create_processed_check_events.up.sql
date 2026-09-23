CREATE TABLE processed_check_events (
    dedup_key TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);