package entity

import "time"

type Event struct {
	Id                   int       `db:"id"                          json:"id"`
	Title                string    `db:"title"                       json:"title"`
	Description          string    `db:"description"                 json:"description"`
	EventTypeId          int       `db:"event_type_id"               json:"eventTypeID"`
	StartAt              time.Time `db:"start_at"                    json:"startAt"`
	RegistrationOpensAt  time.Time `db:"registration_opens_at"       json:"registrationOpensAt"`
	RegistrationClosesAt time.Time `db:"registration_closes_at"      json:"registrationClosesAt"`
	CreatedBy            int       `db:"created_by"                  json:"createdBy"`
	UpdatedBy            *int      `db:"updated_by"                  json:"updatedBy"`
	Remarks              *string   `db:"remarks"                     json:"remarks"`
	CreatedAt            time.Time `db:"created_at"                  json:"createdAt"`
	UpdateAt             time.Time `db:"updated_at"                  json:"updatedAt"`
	IsActive             bool      `db:"is_active"                   json:"isActive"`
}
