package entity

import "time"

// EventOccurrence is one row of the append-only log the auto-create worker
// appends to every time it materializes an occurrence of a hot event.
// The UNIQUE (event_id, scheduled_date) constraint is the idempotency guard:
// one occurrence per template per calendar slot, enforced by the database.
type EventOccurrence struct {
	Id            int       `db:"id"             json:"id"`
	EventId       int       `db:"event_id"       json:"eventId"`
	ScheduledDate time.Time `db:"scheduled_date" json:"scheduledDate"`
	StartAt       time.Time `db:"start_at"       json:"startAt"`
	PerformedAt   time.Time `db:"performed_at"   json:"performedAt"`
	PerformedBy   int       `db:"performed_by"   json:"performedBy"`
	CreatedAt     time.Time `db:"created_at"     json:"createdAt"`
}
