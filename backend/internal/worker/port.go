package worker

import (
	"context"
	"identity-rbac/internal/entity"

	"github.com/jmoiron/sqlx"
)

type AutoEventCreateWorkerService interface {
	Run(ctx context.Context)
}

type EventRepo interface {
	AutoCreateEvent(ctx context.Context, event entity.Events) error
	GetEventDetailsIn(ctx context.Context, eventIDs ...int) []entity.Events
}

type EventTypeSettingsRepo interface {
	GetEventTypeSettingsIn(ctx context.Context, eventTypeIDs ...int) []entity.EventTypeSettings
}

type HotEventsRepo interface {
	GetHotEvents(ctx context.Context, tx *sqlx.Tx) ([]entity.HotEvents, error)
	UpdateLastRecreatedHotEvent(ctx context.Context, tx *sqlx.Tx, eventID, eventTypeID int) error
}

type WorkerTransactionRepo interface {
	BeginTx(ctx context.Context) (*sqlx.Tx, error)
	CommitTx(ctx context.Context, tx *sqlx.Tx) error
	RollbackTx(ctx context.Context, tx *sqlx.Tx) error
}
