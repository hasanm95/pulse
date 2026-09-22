CREATE TABLE IF NOT EXISTS monitor_states (
    monitor_id UUID PRIMARY KEY,
    last_status VARCHAR(10) NOT NULL,
    failure_count INT NOT NULL DEFAULT 0,
    active_incident_id UUID,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_incidents_monitor_status ON incidents (monitor_id, status);
