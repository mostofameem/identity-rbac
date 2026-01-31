package entity

import "time"

type Participants struct {
	Id         int        `db:"id"                          json:"id"`
	EventId    int        `db:"event_id"                    json:"eventId"`
	UserId     int        `db:"user_id"                     json:"userId"`
	GuestCount int        `db:"guest_count"                 json:"guestCount"`
	Status     string     `db:"status"                      json:"status"`
	Remarks    *string    `db:"remarks"                     json:"remarks"`
	CreatedAt  time.Time  `db:"created_at"                  json:"createdAt"`
	CreatedBy  *int       `db:"created_by"                  json:"createdBy"`
	UpdatedAt  *time.Time `db:"updated_at"                  json:"updatedAt"`
	UpdatedBy  *int       `db:"updated_by"                  json:"updatedBy"`
}
