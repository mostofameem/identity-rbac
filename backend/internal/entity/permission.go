package entity

import "time"

type Permission struct {
	Id          int        `db:"id"                          json:"id"`
	Name        string     `db:"name"                        json:"name"`
	Resource    string     `db:"resource"                    json:"resource"`
	Action      string     `db:"action"                      json:"action"`
	Description string     `db:"description"                 json:"description"`
	CreatedBy   int        `db:"created_by"                  json:"createdBy"`
	IsActive    bool       `db:"is_active"                   json:"isActive"`
	CreatedAt   time.Time  `db:"created_at"                  json:"createdAt"`
	UpdatedAt   *time.Time `db:"updated_at"                  json:"updatedAt"`
}
