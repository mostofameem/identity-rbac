package entity

import "time"

type Permission struct {
	Id         int        `db:"id"                          json:"id"`
	Name       string     `db:"name"                        json:"name"`
	Operations string     `db:"operations"                  json:"operation"`
	CreatedBy  int        `db:"created_by"                  json:"createdBy"`
	CreatedAt  time.Time  `db:"created_at"                  json:"createdAt"`
	UpdatedAt  *time.Time `db:"updated_at"                  json:"updatedAt"`
}
