package entity

import "time"

type UserOnboarding struct {
	Id        string    `db:"id"`
	Email     string    `db:"email"`
	RoleIds   string    `db:"role_ids"`
	Status    string    `db:"status"`
	Completed bool      `db:"completed"`
	CreatedBy int       `db:"created_by"`
	ExpiredAt time.Time `db:"expired_at"`
	CreatedAt time.Time `db:"created_at"`
}
