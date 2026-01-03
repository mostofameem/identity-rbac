-- +migrate Up

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type_id INT NOT NULL,
    should_auto_create_event BOOLEAN DEFAULT false,
    start_at TIMESTAMP NOT NULL,
    registration_opens_at TIMESTAMP,
    registration_closes_at TIMESTAMP,
    total_participants INT NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    remarks VARCHAR(250),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_registration
ON events (registration_opens_at, registration_closes_at);
