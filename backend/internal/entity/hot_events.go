package entity

import "time"

type HotEvents struct {
	ID              int       `json:"id"`
	EventID         int       `json:"event_id"`
	EventTypeID     int       `json:"event_type_id"`
	LastRecreatedAt time.Time `json:"last_recreated_at"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
