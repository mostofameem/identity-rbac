package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/event"
	"identity-rbac/pkg/logger"
	"log/slog"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type EventTypeRepo interface {
	event.EventTypeRepo
}

type eventTypeRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewEventTypeRepo(db *DB) EventTypeRepo {
	return &eventTypeRepo{
		table: "event_types",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *eventTypeRepo) GetByID(ctx context.Context, id int) (*entity.EventType, error) {
	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"id": id}).
		Where(sq.Eq{"is_active": true}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"error": err.Error(),
			"id":    id,
		}))
		return nil, err
	}

	var eventType entity.EventType
	if err := r.db.GetContext(ctx, &eventType, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("Failed to get event type", logger.Extra(map[string]any{
			"err": err.Error(),
			"id":  id,
		}))
		return nil, err
	}

	return &eventType, nil
}
