package entity

type EventType struct {
	Id                        string  `json:"id"                             db:"id"`
	Name                      string  `json:"name"                           db:"name"`
	Description               string  `json:"description"                    db:"description"`
	CreatedBy                 int     `json:"created_by"                     db:"created_by"`
	CreatedAt                 string  `json:"created_at"                     db:"created_at"`
	UpdatedAt                 *string `json:"updated_at"                     db:"updated_at"`
	AutoEventCreate           *bool   `json:"autoEventCreate"                db:"auto_event_create"`
	AutoEventIntervalInSecond *int    `json:"autoEventIntervalInSecond"      db:"auto_event_interval_in_second"`
	IsActive                  bool    `json:"isActive"                       db:"is_active"`
}
