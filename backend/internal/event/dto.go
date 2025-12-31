package event

import "time"

type CreateEventReq struct {
	Title                string
	Description          string
	EventTypeId          int
	StartAt              time.Time
	RegistrationOpensAt  *time.Time
	RegistrationClosesAt *time.Time
	CreatedBy            int
	CreatedAt            time.Time
}

type EventResponse struct {
	Id                   int        `json:"id"`
	Title                string     `json:"title"`
	Description          string     `json:"description"`
	EventTypeId          int        `json:"eventTypeId"`
	StartAt              time.Time  `json:"startAt"`
	RegistrationOpensAt  *time.Time `json:"registrationOpensAt"`
	RegistrationClosesAt *time.Time `json:"registrationClosesAt"`
	AutoEventCreate      bool       `json:"autoEventCreate"`
	CreatedBy            *int       `json:"createdBy"`
	UpdatedBy            *int       `json:"updatedBy"`
	Remarks              string     `json:"remarks"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            *time.Time `json:"updatedAt"`
	IsActive             bool       `json:"isActive"`
}

type CreateEventTypeReq struct {
	Name        string
	Description string
	CreatedAt   time.Time
	CreatedBy   int
	IsActive    bool
}

type GetEventTypesReq struct {
	Name  string
	Page  int
	Limit int
}

type GetEventTypeResponse struct {
	Id          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}
