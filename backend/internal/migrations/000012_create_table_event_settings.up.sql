-- +migrate Up
CREATE TABLE IF NOT EXISTS event_settings (
    id BIGINT  PRIMARY KEY,
    event_id BIGINT NOT NULL,
    auto_create_at TIMESTAMP NULL DEFAULT NULL,
    auto_event_interval_in_minites INT,
    from_date DATE NULL,
    to_date DATE NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    remarks VARCHAR(250) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_settings_event_id
    ON event_settings (event_id);

CREATE INDEX IF NOT EXISTS idx_event_settings_active
    ON event_settings (is_active);
