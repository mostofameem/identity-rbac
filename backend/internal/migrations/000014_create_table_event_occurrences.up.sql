-- +migrate Up

CREATE TABLE IF NOT EXISTS event_occurrences (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    start_at TIMESTAMP NOT NULL,
    performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    performed_by BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_occurrence_slot UNIQUE (event_id, scheduled_date)
);

CREATE INDEX IF NOT EXISTS idx_event_occurrences_event_id
    ON event_occurrences (event_id);

-- Port over the last recreated timestamp so existing hot events do not re-clone.
-- last_recreated_at is nullable: rows without it are skipped, which leaves them
-- on anchor-date fallback semantics (the same as having no occurrence row).
INSERT INTO event_occurrences (event_id, scheduled_date, start_at, performed_at)
SELECT he.event_id,
       he.last_recreated_at::date,
       he.last_recreated_at,
       he.last_recreated_at
FROM hot_events he
WHERE he.last_recreated_at IS NOT NULL
ON CONFLICT (event_id, scheduled_date) DO NOTHING;

ALTER TABLE event_type_settings
    ADD COLUMN IF NOT EXISTS recurrence VARCHAR(16) NOT NULL DEFAULT 'DAILY';

CREATE INDEX IF NOT EXISTS idx_events_auto_create_scan
    ON events (id)
    WHERE should_auto_create_event = true AND is_active = true AND is_deleted = false;
