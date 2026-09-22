CREATE TABLE IF NOT EXISTS monitor_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL,
    status VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    response_time_ms BIGINT NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monitor_results_id_time ON monitor_results (monitor_id, checked_at DESC);
