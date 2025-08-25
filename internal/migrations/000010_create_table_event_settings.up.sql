-- +migrate Up


CREATE TABLE IF NOT EXISTS event_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT UNSIGNED NOT NULL,
    auto_create_at TIMESTAMP NULL DEFAULT NULL,
    from_date DATE NULL,
    to_date DATE NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    remarks VARCHAR(250) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
        
    INDEX idx_event_settings_event_id (event_id),
    INDEX idx_event_settings_active (is_active)
);
