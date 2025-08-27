-- +migrate Up

CREATE TABLE IF NOT EXISTS user_onboarding_process (
    id UUID PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    role_ids VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    completed BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    expired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_process_id ON user_onboarding_process(id);
