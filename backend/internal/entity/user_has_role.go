package entity

import "time"

type UserHasRole struct {
	Id        int       `db:"id"         json:"id"`
	UserID    int       `db:"user_id"    json:"userId"`
	RoleID    int       `db:"role_id"    json:"roleId"`
	AddedBy   int       `db:"added_by"   json:"addedBy"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
}
