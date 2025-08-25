-- +migrate Up

CREATE TABLE IF NOT EXISTS user_has_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    added_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
