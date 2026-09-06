-- +migrate Down

CREATE TABLE IF NOT EXISTS hot_events (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    event_type_id INTEGER NOT NULL,
    last_recreated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
);

ALTER TABLE event_type_settings
    ADD COLUMN IF NOT EXISTS auto_event_interval_in_minutes BIGINT;
