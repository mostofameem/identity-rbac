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

    total_participants INT DEFAULT 0,
    max_participants INT NOT NULL,

    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    remarks VARCHAR(250),

    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_participant_limits
    CHECK (
        total_participants >= 0
        AND max_participants >= 0
        AND total_participants <= max_participants
    )
);

CREATE INDEX IF NOT EXISTS idx_events_registration
ON events (registration_opens_at, registration_closes_at);

CREATE INDEX IF NOT EXISTS idx_events_active
ON events (id)
WHERE is_active = true AND is_deleted = false;

