-- +migrate Up

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type_id INT NOT NULL,
    start_at DATETIME NOT NULL,
    registration_opens_at DATETIME,
    registration_closes_at DATETIME,
    created_by INT,
    updated_by INT,
    remarks VARCHAR(250),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

