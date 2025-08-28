package entity

import "time"

type Users struct {
	Id        int       `db:"id"                              json:"Id"`
	Email     string    `db:"email"                           json:"email"`
	Pass      string    `db:"password"                        json:"pass"`
	FirstName string    `db:"first_name"                      json:"firstName"`
	LastName  string    `db:"last_name"                       json:"lastName"`
	IsActive  bool      `db:"is_active"                       json:"isActive"`
	CreatedAt time.Time `db:"created_at"                      json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at"                      json:"updatedAt"`
}
