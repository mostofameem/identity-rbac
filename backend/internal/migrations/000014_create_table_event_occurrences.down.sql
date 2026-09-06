-- +migrate Down

DROP INDEX IF EXISTS idx_events_auto_create_scan;

ALTER TABLE event_type_settings DROP COLUMN IF EXISTS recurrence;

DROP TABLE IF EXISTS event_occurrences;
