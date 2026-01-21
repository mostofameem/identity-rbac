-- +migrate Up
CREATE TABLE IF NOT EXISTS event_type_settings (
    id BIGSERIAL PRIMARY KEY,
    event_type_id BIGINT NOT NULL,
    auto_create_at TIME NULL DEFAULT NULL,
    auto_event_interval_in_minutes BIGINT,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    remarks VARCHAR(250) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_type_settings_event_type_id
    ON event_type_settings (event_type_id);

CREATE INDEX IF NOT EXISTS idx_event_type_settings_active
    ON event_type_settings (is_active);
