package entity

import "time"

// AutoCreateEventTemplate is the worker's scan projection: an event flagged
// should_auto_create_event = true, joined with its type's recurrence settings
// and the last occurrence slot already materialized for it.
type AutoCreateEventTemplate struct {
	Id                   int       `db:"id"`
	Title                string    `db:"title"`
	Description          string    `db:"description"`
	EventTypeId          int       `db:"event_type_id"`
	StartAt              time.Time `db:"start_at"`
	RegistrationOpensAt  time.Time `db:"registration_opens_at"`
	RegistrationClosesAt time.Time `db:"registration_closes_at"`
	MaxParticipants      int       `db:"max_participants"`
	Remarks              *string   `db:"remarks"`
	Recurrence           string    `db:"recurrence"`
	AutoCreateAt         *string   `db:"auto_create_at"`
	LastDone             time.Time `db:"last_done"`
	HasOccurrence        bool      `db:"has_occurrence"`
}
