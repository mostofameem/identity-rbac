package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/api/utils"
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

func (r *eventTypeRepo) GetByName(ctx context.Context, name string) (*entity.EventType, error) {
	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"name": name}).
		Where(sq.Eq{"is_active": true}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"error": err.Error(),
			"name":  name,
		}))
		return nil, err
	}

	var eventType entity.EventType
	if err := r.db.GetContext(ctx, &eventType, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("Failed to get event type", logger.Extra(map[string]any{
			"err":  err.Error(),
			"name": name,
		}))
		return nil, err
	}

	return &eventType, nil
}

func (r *eventTypeRepo) Create(ctx context.Context, req event.CreateEventTypeReq) (int, error) {
	query, args, err := r.psql.Insert(r.table).
		Columns("name", "description", "created_at", "created_by", "is_active", "updated_at").
		Values(req.Name, req.Description, req.CreatedAt, req.CreatedBy, req.IsActive, req.CreatedAt).
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		slog.Error("Failed to build insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return 0, err
	}

	var id int
	err = r.db.QueryRowContext(ctx, query, args...).Scan(&id)
	if err != nil {
		slog.Error("Failed to execute insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  req,
		}))
		return 0, err
	}

	return id, nil
}

func (r *eventTypeRepo) GetAllWithPagination(ctx context.Context, req event.GetEventTypesReq) ([]entity.EventType, error) {
	limit, Offset := utils.ConfigPageSize(req.Page, req.Limit)

	query, args, err := NewQueryBuilder(r.getEventTypeQueryBuilder()).
		FilterByPrefix("name", req.Name).
		Limit(limit).
		Offset(Offset).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var eventTypes []entity.EventType
	if err := r.db.SelectContext(ctx, &eventTypes, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("Failed to execute query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return nil, err
	}

	return eventTypes, nil
}

func (r *eventTypeRepo) GetTotalEventTypeCount(
	ctx context.Context,
	req event.GetEventTypesReq,
) (int, error) {

	query, args, err := NewQueryBuilder(r.getEventTypeCountQueryBuilder()).
		FilterByPrefix("name", req.Name).
		FilterByBoolean("is_active", true).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return 0, err
	}

	var totalItem int
	if err := r.db.GetContext(ctx, &totalItem, query, args...); err != nil {
		slog.Error("Failed to execute query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return 0, err
	}

	return totalItem, nil
}

func (r *eventTypeRepo) GetByIDs(
	ctx context.Context,
	ids []int,
) ([]entity.EventType, error) {

	if len(ids) == 0 {
		return nil, nil
	}

	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"id": ids}).
		Where(sq.Eq{"is_active": true}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"error": err.Error(),
			"ids":   ids,
		}))
		return nil, err
	}

	var eventTypes []entity.EventType
	if err := r.db.SelectContext(ctx, &eventTypes, query, args...); err != nil {
		slog.Error("Failed to get event types", logger.Extra(map[string]any{
			"err": err.Error(),
			"ids": ids,
		}))
		return nil, err
	}

	return eventTypes, nil
}

func (r *eventTypeRepo) getEventTypeQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"id",
			"name",
			"description",
			"is_active",
		).
			From(r.table)
	}
}

func (r *eventTypeRepo) getEventTypeCountQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"COUNT(*)",
		).
			From(r.table)
	}
}

func (r *eventTypeRepo) UpdateIsActiveStatus(ctx context.Context, id int, isActive bool) error {

	query, args, err := r.psql.
		Update(r.table).
		Set("is_active", isActive).
		Where(sq.Eq{"id": id}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"id":    id,
		}))
		return err
	}

	if _, err := r.db.ExecContext(ctx, query, args...); err != nil {
		slog.Error("Failed to execute update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return err
	}

	return nil
}
