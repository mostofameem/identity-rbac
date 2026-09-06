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
	GetAutoCreateEventTemplates(ctx context.Context) ([]entity.AutoCreateEventTemplate, error)
	CreateEventInTx(ctx context.Context, tx *sqlx.Tx, event entity.Events, systemUserID int) error
}

type OccurrenceRepo interface {
	ClaimOccurrence(ctx context.Context, tx *sqlx.Tx, occurrence entity.EventOccurrence) (bool, error)
}

type WorkerTransactionRepo interface {
	BeginTx(ctx context.Context) (*sqlx.Tx, error)
	CommitTx(ctx context.Context, tx *sqlx.Tx) error
	RollbackTx(ctx context.Context, tx *sqlx.Tx) error
}
