package worker

import (
	"context"
	"identity-rbac/internal/entity"
)

type EventRepo interface {
	GetEventDetailsIn(ctx context.Context, eventIDs ...int) []entity.Events
}

type EventTypeSettingsRepo interface {
	GetEventTypeSettingsIn(ctx context.Context, eventTypeIDs ...int) []entity.EventTypeSettings
}

type HotEventsRepo interface {
	GetHotEvents(ctx context.Context) []entity.HotEvents
	UpdateLastRecreatedHotEvent(ctx context.Context, eventID, eventTypeID int) error
}
