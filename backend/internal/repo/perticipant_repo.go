package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/event"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type ParticipantRepo interface {
	event.ParticipantRepo
}

type participantRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewParticipantRepo(db *DB) ParticipantRepo {
	return &participantRepo{
		table: "participants",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *participantRepo) Create(ctx context.Context, tx *sqlx.Tx, req event.PerticipateEventReq) error {

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

func (r *participantRepo) Exists(ctx context.Context, tx *sqlx.Tx, eventID, userID int) (bool, error) {

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

func (r *participantRepo) GetMyPerticipations(ctx context.Context, req event.GetEventPerticipationsReq) ([]event.EventPerticipationDto, error) {
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

func (r *participantRepo) GetMyPerticipationCount(ctx context.Context, req event.GetEventPerticipationsReq) (int, error) {
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

func (r *participantRepo) getPerticipationQueryBuilder() BuildQuery {
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

func (r *participantRepo) getPerticipationCountQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"COUNT(p.id)",
		).
			From("participants p").
			LeftJoin("events e ON e.id = p.event_id").
			LeftJoin("event_types et ON et.id = e.event_type_id")
	}
}

func (r *participantRepo) UpdateStatus(ctx context.Context, tx *sqlx.Tx, req event.UpdatePerticipationStatusReq) error {
	query, args, err := r.psql.Update(r.table).
		Set("status", req.Status).
		Set("remarks", req.Remarks).
		Set("updated_at", req.CurrentTime).
		Set("updated_by", req.UserId).
		Where(sq.Eq{"event_id": req.EventId, "user_id": req.UserId}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		slog.Error("Failed to execute update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  req,
		}))
		return err
	}

	return nil
}

func (r *participantRepo) GetByID(ctx context.Context, tx *sqlx.Tx, eventID, userID int) (*entity.Participants, error) {
	query, args, err := r.psql.Select(
		"id", "event_id", "user_id", "guest_count", "status", "remarks", "created_at", "created_by", "updated_at", "updated_by",
	).
		From(r.table).
		Where(sq.Eq{"event_id": eventID, "user_id": userID}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build select query", logger.Extra(map[string]any{
			"error":   err.Error(),
			"eventID": eventID,
			"userID":  userID,
		}))
		return nil, err
	}

	var perticipant entity.Participants
	err = tx.GetContext(ctx, &perticipant, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		slog.Error("Failed to execute select query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return nil, err
	}

	return &perticipant, nil
}

func (r *participantRepo) UpdateGuestCount(ctx context.Context, tx *sqlx.Tx, userId int, eventId int, guestCount int) error {
	query, args, err := r.psql.
		Update(r.table).
		Set("guest_count", guestCount).
		Set("updated_at", time.Now()).
		Set("updated_by", userId).
		Where(sq.Eq{"event_id": eventId, "user_id": userId}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return err
	}

	if _, err := tx.ExecContext(ctx, query, args...); err != nil {
		slog.Error("Failed to execute update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return err
	}

	return nil
}

func (r *participantRepo) GetEventParticipants(ctx context.Context, req event.GetEventParticipantsReq) ([]event.EventParticipantDetailDto, error) {
	limit, Offset := utils.ConfigPageSize(req.Page, req.Limit)

	qb := r.psql.Select(
		"u.email AS user_email",
		"p.guest_count AS guest_count",
		"p.status AS status",
		"p.created_at AS created_at",
		"p.updated_at AS updated_at",
		"p.remarks AS remarks",
	).
		From(r.table + " p").
		LeftJoin("users u ON u.id = p.user_id").
		Where(sq.Eq{"p.event_id": req.EventId})

	if req.Email != "" {
		qb = qb.Where(sq.Like{"u.email": "%" + req.Email + "%"})
	}

	query, args, err := qb.
		Limit(uint64(limit)).
		Offset(uint64(Offset)).
		OrderBy("p.created_at DESC").
		ToSql()

	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var participants []event.EventParticipantDetailDto
	if err := r.db.SelectContext(ctx, &participants, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		slog.Error("Failed to execute query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
		}))
		return nil, err
	}

	return participants, nil
}

func (r *participantRepo) GetEventParticipantsCount(ctx context.Context, req event.GetEventParticipantsReq) (int, error) {
	qb := r.psql.Select("COUNT(p.id)").
		From(r.table + " p").
		LeftJoin("users u ON u.id = p.user_id").
		Where(sq.Eq{"p.event_id": req.EventId})

	if req.Email != "" {
		qb = qb.Where(sq.Like{"u.email": "%" + req.Email + "%"})
	}

	query, args, err := qb.ToSql()
	if err != nil {
		slog.Error("Failed to build count query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return 0, err
	}

	var count int
	if err := r.db.GetContext(ctx, &count, query, args...); err != nil {
		slog.Error("Failed to execute count query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
		}))
		return 0, err
	}

	return count, nil
}
