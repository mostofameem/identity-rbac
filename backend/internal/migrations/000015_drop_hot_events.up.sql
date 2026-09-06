-- +migrate Up

DROP TABLE IF EXISTS hot_events;

ALTER TABLE event_type_settings DROP COLUMN IF EXISTS auto_event_interval_in_minutes;
