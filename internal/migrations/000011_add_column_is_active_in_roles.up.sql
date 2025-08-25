-- +migrate Up

ALTER TABLE roles
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER description;