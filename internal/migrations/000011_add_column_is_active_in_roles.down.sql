-- +migrate Down

ALTER TABLE roles
DROP COLUMN is_active;