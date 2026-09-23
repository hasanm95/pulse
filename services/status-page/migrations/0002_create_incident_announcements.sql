CREATE TABLE incident_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_page_id UUID NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
    incident_id UUID,
    message TEXT NOT NULL,
    current_status TEXT NOT NULL DEFAULT 'investigating',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);