package entity

import "time"

type Events struct {
	Id                    int        `db:"id"                          json:"id"`
	Title                 string     `db:"title"                       json:"title"`
	Description           string     `db:"description"                 json:"description"`
	EventTypeId           int        `db:"event_type_id"               json:"eventTypeId"`
	StartAt               time.Time  `db:"start_at"                    json:"startAt"`
	RegistrationOpensAt   time.Time  `db:"registration_opens_at"       json:"registrationOpensAt"`
	RegistrationClosesAt  time.Time  `db:"registration_closes_at"      json:"registrationClosesAt"`
	ShouldAutoCreateEvent bool       `db:"should_auto_create_event"    json:"shouldAutoCreateEvent"`
	TotalParticipants     int        `db:"total_participants"          json:"totalParticipants"`
	MaxParticipants       int        `db:"max_participants"            json:"maxParticipants"`
	IsActive              bool       `db:"is_active"                   json:"isActive"`
	IsDeleted             bool       `db:"is_deleted"                  json:"isDeleted"`
	CreatedBy             *int       `db:"created_by"                  json:"createdBy"`
	UpdatedBy             *int       `db:"updated_by"                  json:"updatedBy"`
	Remarks               *string    `db:"remarks"                     json:"remarks"`
	CreatedAt             time.Time  `db:"created_at"                  json:"createdAt"`
	UpdatedAt             *time.Time `db:"updated_at"                  json:"updatedAt"`
}
