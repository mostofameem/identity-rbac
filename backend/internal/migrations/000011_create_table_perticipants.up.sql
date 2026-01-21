-- +migrate Up

CREATE TABLE IF NOT EXISTS participants (
    id BIGSERIAL PRIMARY KEY,

    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    guest_count INT DEFAULT 0,
    status VARCHAR(50),
    remarks VARCHAR(250),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_event_user UNIQUE (event_id, user_id),

    CONSTRAINT fk_participants_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_participants_event
ON participants (event_id);

CREATE INDEX IF NOT EXISTS idx_participants_user
ON participants (user_id);
