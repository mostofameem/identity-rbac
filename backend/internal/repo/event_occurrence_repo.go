package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/event"
	"identity-rbac/internal/worker"
	"identity-rbac/pkg/logger"
	"log/slog"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type EventOccurrenceRepo interface {
	worker.OccurrenceRepo
	event.OccurrenceRepo
}

type eventOccurrenceRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewEventOccurrenceRepo(db *DB) EventOccurrenceRepo {
	return &eventOccurrenceRepo{
		table: "event_occurrences",
		db:    db.Db,
		psql:  db.Psql,
	}
}

// ClaimOccurrence is the worker's idempotency guard. It inserts the slot
// claim with ON CONFLICT DO NOTHING and reports whether this call won the
// slot; only the winner may create the clone in the same transaction.
func (r *eventOccurrenceRepo) ClaimOccurrence(ctx context.Context, tx *sqlx.Tx, occurrence entity.EventOccurrence) (bool, error) {
	query, args, err := r.psql.Insert(r.table).
		Columns("event_id", "scheduled_date", "start_at", "performed_by").
		Values(occurrence.EventId, occurrence.ScheduledDate, occurrence.StartAt, occurrence.PerformedBy).
		Suffix("ON CONFLICT (event_id, scheduled_date) DO NOTHING").
		ToSql()
	if err != nil {
		slog.Error("Failed to build claim occurrence query", logger.Extra(map[string]any{
			"event_id":       occurrence.EventId,
			"scheduled_date": occurrence.ScheduledDate,
			"error":          err.Error(),
		}))
		return false, err
	}

	res, err := tx.ExecContext(ctx, query, args...)
	if err != nil {
		slog.Error("Failed to claim occurrence", logger.Extra(map[string]any{
			"event_id":       occurrence.EventId,
			"scheduled_date": occurrence.ScheduledDate,
			"error":          err.Error(),
		}))
		return false, err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return false, err
	}

	return rows > 0, nil
}

func (r *eventOccurrenceRepo) GetOccurrences(ctx context.Context, eventID int) ([]entity.EventOccurrence, error) {
	query, args, err := r.psql.Select("*").
		From(r.table).
		Where(sq.Eq{"event_id": eventID}).
		OrderBy("scheduled_date DESC").
		Limit(50).
		ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"event_id": eventID,
			"error":    err.Error(),
		}))
		return nil, err
	}

	var occurrences []entity.EventOccurrence
	if err := r.db.SelectContext(ctx, &occurrences, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		slog.Error("Failed to select occurrences", logger.Extra(map[string]any{
			"event_id": eventID,
			"error":    err.Error(),
		}))
		return nil, err
	}

	return occurrences, nil
}
