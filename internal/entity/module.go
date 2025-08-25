package entity

import "time"

type Module struct {
	Id          string    `json:"id"                             db:"id"`
	Name        string    `json:"name"                           db:"name"`
	Description string    `json:"description"                    db:"description"`
	CreatedAt   time.Time `json:"createdAt"                      db:"created_at"`
}
