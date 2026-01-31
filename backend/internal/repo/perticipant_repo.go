package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/event"
	"identity-rbac/pkg/logger"
	"log/slog"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type PerticipantRepo interface {
	event.PerticipantRepo
}

type perticipantRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewPerticipantRepo(db *DB) PerticipantRepo {
	return &perticipantRepo{
		table: "participants",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *perticipantRepo) Create(ctx context.Context, tx *sqlx.Tx, req event.PerticipateEventReq) error {

	query, args, err := r.psql.Insert(r.table).
		Columns(
			"event_id", "user_id", "guest_count", "status", "remarks", "created_at", "created_by", "updated_at", "updated_by",
		).
		Values(
			req.EventId, req.UserId, req.GuestCount, enum.PerticepateStatusGoing, "", req.CurrentTime, req.UserId, req.CurrentTime, req.UserId,
		).
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		slog.Error("Failed to build insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	var id int
	err = tx.QueryRowContext(ctx, query, args...).Scan(&id)
	if err != nil {
		slog.Error("Failed to execute insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  req,
		}))
		return err
	}

	return nil
}

func (r *perticipantRepo) Exists(ctx context.Context, tx *sqlx.Tx, eventID, userID int) (bool, error) {

	query, args, err := r.psql.Select("1").
		From(r.table).
		Where(sq.Eq{"event_id": eventID, "user_id": userID}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"error":   err.Error(),
			"eventID": eventID,
			"userID":  userID,
		}))
		return false, err
	}

	var exists int
	err = tx.QueryRowContext(ctx, query, args...).Scan(&exists)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		slog.Error("Failed to execute select query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return false, err
	}

	return exists > 0, nil
}

func (r *perticipantRepo) GetMyPerticipations(ctx context.Context, req event.GetEventPerticipationsReq) ([]event.EventPerticipationDto, error) {
	limit, Offset := utils.ConfigPageSize(req.Page, req.Limit)

	query, args, err := NewQueryBuilder(r.getPerticipationQueryBuilder()).
		FilterByIntEq("p.user_id", req.UserId).
		Limit(limit).
		Offset(Offset).
		FilterByTimeRange("p.created_at", req.QueryFrom, req.QueryTo).
		OrderBy("p.updated_at", "DESC").
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var perticipations []event.EventPerticipationDto
	if err := r.db.SelectContext(ctx, &perticipations, query, args...); err != nil {
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

	return perticipations, nil
}

func (r *perticipantRepo) GetMyPerticipationCount(ctx context.Context, req event.GetEventPerticipationsReq) (int, error) {
	query, args, err := NewQueryBuilder(r.getPerticipationCountQueryBuilder()).
		FilterByIntEq("p.user_id", req.UserId).
		FilterByTimeRange("p.created_at", req.QueryFrom, req.QueryTo).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return 0, err
	}

	var count int
	if err := r.db.GetContext(ctx, &count, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil
		}

		slog.Error("Failed to execute query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return 0, err
	}

	return count, nil
}

func (r *perticipantRepo) getPerticipationQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"e.id AS event_id",
			"e.title AS event_title",
			"et.name AS event_type",
			"e.start_at AS event_start_time",
			"p.guest_count AS guest_count",
			"p.status AS status",
			"p.remarks AS remarks",
			"p.created_at AS created_at",
			"p.created_by AS created_by",
			"p.updated_at AS updated_at",
		).
			From("participants p").
			LeftJoin("events e ON e.id = p.event_id").
			LeftJoin("event_types et ON et.id = e.event_type_id")
	}
}

func (r *perticipantRepo) getPerticipationCountQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"COUNT(p.id)",
		).
			From("participants p").
			LeftJoin("events e ON e.id = p.event_id").
			LeftJoin("event_types et ON et.id = e.event_type_id")
	}
}
