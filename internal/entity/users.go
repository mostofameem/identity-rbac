package entity

import "time"

type Users struct {
	Id        int       `db:"id"                              json:"Id"`
	Email     string    `db:"email"                           json:"email"`
	Pass      string    `db:"pass"                            json:"pass"`
	IsActive  bool      `db:"is_active"                       json:"isActive"`
	CreatedAt time.Time `db:"created_at"                      json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at"                      json:"updatedAt"`
}
