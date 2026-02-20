package entity

import "time"

type HotEvents struct {
	Id              int       `db:"id"                 json:"id"`
	EventId         int       `db:"event_id"           json:"event_id"`
	EventTypeId     int       `db:"event_type_id"      json:"event_type_id"`
	LastRecreatedAt time.Time `db:"last_recreated_at"  json:"last_recreated_at"`
	CreatedAt       time.Time `db:"created_at"         json:"created_at"`
	UpdatedAt       time.Time `db:"updated_at"         json:"updated_at"`
}
