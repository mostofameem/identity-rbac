package entity

import "time"

type EventTypeSettings struct {
	Id          int      `db:"id"             json:"id"`
	EventTypeID int      `db:"event_type_id"  json:"eventTypeId"`
	AutoCreateAt *string `db:"auto_create_at" json:"autoCreateAt"`
	Recurrence  string   `db:"recurrence"     json:"recurrence"`
	CreatedBy   *int     `db:"created_by"     json:"createdBy"`
	UpdatedBy                  *int      `db:"updated_by"                       json:"updatedBy"`
	Remarks                    string    `db:"remarks"                          json:"remarks"`
	IsActive                   bool      `db:"is_active"                        json:"isActive"`
	CreatedAt                  time.Time `db:"created_at"                       json:"createdAt"`
	UpdatedAt                  time.Time `db:"updated_at"                       json:"updatedAt"`
}
