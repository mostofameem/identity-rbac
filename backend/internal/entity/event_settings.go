package entity

import "time"

type EventSettings struct {
	Id                         uint64     `db:"id"                               json:"id"`
	EventId                    uint64     `db:"event_id"                         json:"eventId"`
	AutoCreateAt               *time.Time `db:"auto_create_at"                   json:"autoCreateAt"`
	AutoEventIntervalInMinutes int        `db:"auto_event_interval_in_minites"   json:"autoEventIntervalInMinutes"`
	FromDate                   *time.Time `db:"from_date"                        json:"fromDate"`
	ToDate                     *time.Time `db:"to_date"                          json:"toDate"`
	CreatedBy                  *uint64    `db:"created_by"                       json:"createdBy"`
	UpdatedBy                  *uint64    `db:"updated_by"                       json:"updatedBy"`
	Remarks                    string     `db:"remarks"                          json:"remarks"`
	IsActive                   bool       `db:"is_active"                        json:"isActive"`
	CreatedAt                  time.Time  `db:"created_at"                       json:"createdAt"`
	UpdatedAt                  time.Time  `db:"updated_at"                       json:"updatedAt"`
}
