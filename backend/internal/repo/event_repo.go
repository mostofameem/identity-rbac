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

type EventRepo interface {
	event.EventRepo
}

type eventRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewEventRepo(db *DB) EventRepo {
	return &eventRepo{
		table: "events",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *eventRepo) Create(ctx context.Context, req event.CreateEventReq) (int, error) {
	query, args, err := r.psql.Insert(r.table).
		Columns(
			"title", "description", "event_type_id", "start_at",
			"registration_opens_at", "registration_closes_at",
			"should_auto_create_event", "total_participants", "created_by", "created_at", "updated_at", "is_active","updated_by",
		).
		Values(
			req.Title, req.Description, req.EventTypeId, req.StartAt,
			req.RegistrationOpensAt, req.RegistrationClosesAt,
			req.ShouldAutoCreateEvent, req.TotalParticipants, req.CreatedBy, req.CreatedAt, req.CreatedAt, true,req.CreatedBy,
		).
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

func (r *eventRepo) GetByID(ctx context.Context, id int) (*entity.Events, error) {
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

	var event entity.Events
	if err := r.db.GetContext(ctx, &event, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("Failed to get event", logger.Extra(map[string]any{
			"err": err.Error(),
			"id":  id,
		}))
		return nil, err
	}

	return &event, nil
}

func (r *eventRepo) GetEventWithPagination(ctx context.Context, req event.GetEventsQueryReq) ([]entity.Events, error) {
	limit, Offset := utils.ConfigPageSize(req.Page, req.Limit)

	query, args, err := NewQueryBuilder(r.getEventQueryBuilder()).
		FilterByPrefix("title", req.Title).
		FilterByBoolean("is_active", true).
		FilterByMode(string(req.EventStatus), req.CurrentTime).
		Limit(limit).
		Offset(Offset).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var events []entity.Events
	if err := r.db.SelectContext(ctx, &events, query, args...); err != nil {
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

	return events, nil
}

func (r *eventRepo) GetTotalEventCount(
	ctx context.Context,
	req event.GetEventsQueryReq,
) (int, error) {

	query, args, err := NewQueryBuilder(r.getEventCountQueryBuilder()).
		FilterByPrefix("title", req.Title).
		FilterByBoolean("is_active", true).
		FilterByMode(string(req.EventStatus), req.CurrentTime).
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

func (r *eventRepo) getEventQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"*",
		).
			From(r.table)
	}
}

func (r *eventRepo) getEventCountQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"COUNT(*)",
		).
			From(r.table)
	}
}
