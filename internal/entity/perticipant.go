package entity

import "time"

type Participant struct {
	ID         int        `db:"id"          json:"id"`
	EventID    int        `db:"event_id"    json:"eventId"`
	UserID     int        `db:"user_id"     json:"userId"`
	GuestCount int        `db:"guest_count" json:"guestCount"`
	Status     string     `db:"status"      json:"status"`
	Remarks    *string    `db:"remarks"     json:"remarks"`
	CreatedAt  time.Time  `db:"created_at"  json:"createdAt"`
	UpdatedAt  *time.Time `db:"updated_at"  json:"updatedAt"`
}
