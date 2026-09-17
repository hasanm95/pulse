CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL,

    url TEXT NOT NULL,

    type TEXT NOT NULL
        CHECK (type IN ('http', 'tcp', 'ping')),

    interval_seconds INTEGER NOT NULL
        CHECK (interval_seconds > 0),

    regions TEXT[] NOT NULL DEFAULT '{}',

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'paused')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitors_org_id
    ON monitors (org_id);