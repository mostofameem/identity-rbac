package worker

import (
	"context"
	"identity-rbac/internal/entity"

	"github.com/jmoiron/sqlx"
)

type EventRepo interface {
	GetEventDetailsIn(ctx context.Context, eventIDs ...int) []entity.Events
}

type EventTypeSettingsRepo interface {
	GetEventTypeSettingsIn(ctx context.Context, eventTypeIDs ...int) []entity.EventTypeSettings
}

type HotEventsRepo interface {
	GetHotEvents(ctx context.Context, tx *sqlx.Tx) []entity.HotEvents
	UpdateLastRecreatedHotEvent(ctx context.Context, tx *sqlx.Tx, eventID, eventTypeID int) error
}
