package repo

import (
	"context"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/event"
	"identity-rbac/internal/worker"
	"identity-rbac/pkg/logger"
	"log/slog"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type HotEventsRepo interface {
	worker.HotEventsRepo
	event.HotEventsRepo
}

type hotEventsRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewHotEventsRepo(db *DB) HotEventsRepo {
	return &hotEventsRepo{
		table: "hot_events",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *hotEventsRepo) GetHotEvents(ctx context.Context, tx *sqlx.Tx) ([]entity.HotEvents, error) {
	query, args, err := r.psql.Select("*").From(r.table).ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return []entity.HotEvents{}, err
	}
	var events []entity.HotEvents
	if err := tx.SelectContext(ctx, &events, query, args...); err != nil {
		slog.Error("Failed to select hot events", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return []entity.HotEvents{}, err
	}
	return events, nil
}

func (r *hotEventsRepo) CreateHotEvent(ctx context.Context, tx *sqlx.Tx, event entity.HotEvents) error {
	query, args, err := r.psql.Insert(r.table).
		Columns("event_id", "event_type_id", "last_recreated_at", "created_at", "updated_at").
		Values(event.EventID, event.EventTypeID, event.LastRecreatedAt, event.CreatedAt, event.UpdatedAt).
		ToSql()
	if err != nil {
		slog.Error("Failed to build insert query", logger.Extra(map[string]any{
			"event_id":      event.EventID,
			"event_type_id": event.EventTypeID,
			"error":         err.Error(),
		}))
		return err
	}
	if _, err := tx.ExecContext(ctx, query, args...); err != nil {
		slog.Error("Failed to insert hot event", logger.Extra(map[string]any{
			"event_id":      event.EventID,
			"event_type_id": event.EventTypeID,
			"error":         err.Error(),
		}))
		return err
	}
	return nil
}

func (r *hotEventsRepo) DeleteHotEvent(ctx context.Context, tx *sqlx.Tx, eventID int, eventTypeID int) error {
	query, args, err := r.psql.Delete(r.table).
		Where(sq.Eq{"event_id": eventID, "event_type_id": eventTypeID}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build delete query", logger.Extra(map[string]any{
			"event_id":      eventID,
			"event_type_id": eventTypeID,
			"error":         err.Error(),
		}))
		return err
	}
	if _, err := tx.ExecContext(ctx, query, args...); err != nil {
		slog.Error("Failed to delete hot event", logger.Extra(map[string]any{
			"event_id":      eventID,
			"event_type_id": eventTypeID,
			"error":         err.Error(),
		}))
		return err
	}
	return nil
}

func (r *hotEventsRepo) UpdateLastRecreatedHotEvent(ctx context.Context, tx *sqlx.Tx, eventID, eventTypeID int) error {
	query, args, err := r.psql.Update(r.table).
		Set("last_recreated_at", sq.Expr("NOW()")).
		Set("updated_at", sq.Expr("NOW()")).
		Where(sq.Eq{"event_id": eventID, "event_type_id": eventTypeID}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build update query", logger.Extra(map[string]any{
			"event_id":      eventID,
			"event_type_id": eventTypeID,
			"error":         err.Error(),
		}))
		return err
	}
	if _, err := tx.ExecContext(ctx, query, args...); err != nil {
		slog.Error("Failed to update hot event", logger.Extra(map[string]any{
			"event_id":      eventID,
			"event_type_id": eventTypeID,
			"error":         err.Error(),
		}))
		return err
	}
	return nil
}

func (r *hotEventsRepo) GetTotalHotEvents(ctx context.Context, tx *sqlx.Tx) (int, error) {
	query, args, err := r.psql.Select("COUNT(id)").From(r.table).ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return 0, err
	}
	var count int
	if err := tx.GetContext(ctx, &count, query, args...); err != nil {
		slog.Error("Failed to select hot events count", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return 0, err
	}
	return count, nil
}

func (r *hotEventsRepo) IsHotEventExist(ctx context.Context, tx *sqlx.Tx, eventID int, eventTypeID int) (bool, error) {
	query, args, err := r.psql.Select("COUNT(id)").From(r.table).
		Where(sq.Eq{"event_id": eventID, "event_type_id": eventTypeID}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"event_id":      eventID,
			"event_type_id": eventTypeID,
			"error":         err.Error(),
		}))
		return false, err
	}
	var count int
	if err := tx.GetContext(ctx, &count, query, args...); err != nil {
		slog.Error("Failed to select hot events count", logger.Extra(map[string]any{
			"event_id":      eventID,
			"event_type_id": eventTypeID,
			"error":         err.Error(),
		}))
		return false, err
	}
	return count > 0, nil
}
