-- +migrate Up
CREATE TABLE IF NOT EXISTS participants (
    id BIGINT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    guest_count INT DEFAULT 0,
    status VARCHAR(50),
    remarks VARCHAR(250),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, user_id)
);
