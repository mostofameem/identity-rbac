package entity

import "time"

type Role struct {
	Id          int        `db:"id"                          json:"id"`
	Name        string     `db:"name"                        json:"name"`
	Description string     `db:"description"                 json:"description"`
	CreatedBy   int        `db:"created_by"                  json:"createdBy"`
	CreatedAt   time.Time  `db:"created_at"                  json:"createdAt"`
	UpdatedAt   *time.Time `db:"updated_at"                  json:"updatedAt"`
	IsActive    bool       `db:"is_active"                   json:"isActive"`
}
