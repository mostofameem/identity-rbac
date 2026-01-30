package event

import (
	"identity-rbac/internal/enum"
	"time"
)

type CreateEventReq struct {
	Title                 string
	Description           string
	EventTypeId           int
	StartAt               time.Time
	RegistrationOpensAt   *time.Time
	RegistrationClosesAt  *time.Time
	ShouldAutoCreateEvent bool
	MaxParticipants       int
	CreatedBy             *int
	CreatedAt             time.Time
}

type EventResponse struct {
	Id                    int             `json:"id"`
	Title                 string          `json:"title"`
	Description           string          `json:"description"`
	EventTypeId           GetEventTypeDto `json:"eventType"`
	StartAt               time.Time       `json:"startAt"`
	RegistrationOpensAt   *time.Time      `json:"registrationOpensAt"`
	RegistrationClosesAt  *time.Time      `json:"registrationClosesAt"`
	ShouldAutoCreateEvent bool            `json:"shouldAutoCreateEvent"`
	TotalParticipants     int             `json:"totalParticipants"`
	MaxParticipants       int             `json:"maxParticipants"`
	Status                string          `json:"status"`
	CreatedBy             *int            `json:"createdBy"`
	UpdatedBy             *int            `json:"updatedBy"`
	Remarks               *string         `json:"remarks"`
	CreatedAt             time.Time       `json:"createdAt"`
	UpdatedAt             *time.Time      `json:"updatedAt"`
	IsActive              bool            `json:"isActive"`
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
	IsActive    bool   `json:"isActive"`
}

type GetEventTypeDto struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	IsActive bool   `json:"isActive"`
}

type GetEventsQueryReq struct {
	Title       string
	Page        int
	Limit       int
	CurrentTime time.Time
	EventStatus enum.EventStatusType
}

type GetEventsReq struct {
	Title       string
	EventStatus enum.EventStatusType
	Page        int
	Limit       int
	CurrentTime time.Time
}

type EventCustomerResponse struct {
	Id                   int                  `json:"id"`
	Title                string               `json:"title"`
	Description          string               `json:"description"`
	EventType            GetEventTypeResponse `json:"eventType"`
	StartAt              time.Time            `json:"startAt"`
	RegistrationOpensAt  *time.Time           `json:"registrationOpensAt"`
	RegistrationClosesAt *time.Time           `json:"registrationClosesAt"`
	TotalParticipants    int                  `json:"totalParticipants"`
	MaxParticipants      int                  `json:"maxParticipants"`
	Status               enum.EventStatusType `json:"status"`
	IsActive             bool                 `json:"isActive"`
}

type PerticipateEventReq struct {
	EventId     int
	UserId      int
	GuestCount  int
	CurrentTime time.Time
}

type EventTypeSettingsRequest struct {
	EventTypeId                int
	AutoCreateAt               string
	AutoEventIntervalInMinutes int
	RequestBy                  int
	Remarks                    string
	IsActive                   bool
}

type EventTypeSettingsResponse struct {
	Id                         int
	EventTypeId                int
	AutoCreateAt               string
	AutoEventIntervalInMinutes int
	CreatedBy                  *int
	IsActive                   bool
}

type EventTypeResponse struct {
	Id          int        `db:"id"                          json:"id"`
	Name        string     `db:"name"                        json:"name"`
	Description string     `db:"description"                 json:"description"`
	CreatedBy   int        `db:"created_by"                  json:"createdBy"`
	CreatedAt   time.Time  `db:"created_at"                  json:"createdAt"`
	UpdatedAt   *time.Time `db:"updated_at"                  json:"updatedAt"`
	IsActive    bool       `db:"is_active"                   json:"isActive"`
}
