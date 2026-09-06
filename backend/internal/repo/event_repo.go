package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/event"
	"identity-rbac/internal/worker"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type EventRepo interface {
	event.EventRepo
	worker.EventRepo
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
			"should_auto_create_event", "max_participants", "created_by", "created_at", "updated_at", "is_active", "updated_by",
		).
		Values(
			req.Title, req.Description, req.EventTypeId, req.StartAt,
			req.RegistrationOpensAt, req.RegistrationClosesAt,
			req.ShouldAutoCreateEvent, req.MaxParticipants, req.CreatedBy, req.CreatedAt, req.CreatedAt, true, req.CreatedBy,
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

func (r *eventRepo) GetByID(ctx context.Context, tx *sqlx.Tx, id int) (*entity.Events, error) {
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

	var event entity.Events

	// Use tx if provided, otherwise use the database connection
	var db sqlx.QueryerContext = r.db
	if tx != nil {
		db = tx
	}

	if err := sqlx.GetContext(ctx, db, &event, query, args...); err != nil {
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

func (r *eventRepo) UpdateParticipantCount(ctx context.Context, tx *sqlx.Tx, eventID, count int) error {
	query, args, err := r.psql.Update(r.table).
		Set("total_participants", count).
		Set("updated_at", sq.Expr("NOW()")).
		Where(sq.Eq{"id": eventID}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build update participant count query", logger.Extra(map[string]any{
			"error":   err.Error(),
			"eventID": eventID,
			"count":   count,
		}))
		return err
	}

	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		slog.Error("Failed to update participant count", logger.Extra(map[string]any{
			"error":   err.Error(),
			"eventID": eventID,
			"count":   count,
		}))
		return err
	}

	return nil
}

func (r *eventRepo) GetEventWithPagination(ctx context.Context, req event.GetEventsQueryReq) ([]entity.Events, error) {
	limit, Offset := utils.ConfigPageSize(req.Page, req.Limit)

	query, args, err := NewQueryBuilder(r.getEventQueryBuilder()).
		FilterByPrefix("title", req.Title).
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

func (r eventRepo) GetByIDForUpdate(
	ctx context.Context,
	tx *sqlx.Tx,
	id int,
) (*entity.Events, error) {

	if tx == nil {
		return nil, errors.New("transaction is required for GetByIDForUpdate")
	}

	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{
			"id":        id,
			"is_active": true,
		}).
		Suffix("FOR UPDATE").
		ToSql()

	if err != nil {
		slog.Error("Failed to build select-for-update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"id":    id,
		}))
		return nil, err
	}

	var event entity.Events

	if err := tx.GetContext(ctx, &event, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("Failed to get event for update", logger.Extra(map[string]any{
			"error": err.Error(),
			"id":    id,
		}))
		return nil, err
	}

	return &event, nil
}

func (r *eventRepo) UpdateIsActiveStatus(ctx context.Context, tx *sqlx.Tx, id int, isActive bool) error {

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

func (r *eventRepo) GetPublicEventWithPagination(ctx context.Context, userId int, title string, limit int, page int, status string) ([]event.EventPublicResponse, error) {
	limit, Offset := utils.ConfigPageSize(page, limit)

	query, args, err := NewQueryBuilder(r.getPublicEventQueryBuilder(userId, status)).
		FilterByPrefix("e.title", title).
		FilterByMode(status, time.Now()).
		FilterByBoolean("e.is_active", true).
		Limit(limit).
		Offset(Offset).
		OrderBy("e.start_at", "DESC").
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var events []event.EventPublicResponse
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

func (r *eventRepo) GetTotalPublicEventCount(ctx context.Context, status string) (int, error) {
	query, args, err := NewQueryBuilder(r.getEventCountQueryBuilder()).
		FilterByBoolean("is_active", true).
		FilterByMode(status, time.Now()).
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
			"COUNT(id)",
		).
			From(r.table)
	}
}

func (r *eventRepo) getPublicEventQueryBuilder(userId int, status string) BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"e.id AS id",
			"e.title AS title",
			"e.description AS description",
			"et.name AS event_type",
			"e.start_at AS start_at",
			"e.registration_opens_at AS registration_opens_at",
			"e.registration_closes_at AS registration_closes_at",
			"e.total_participants AS total_participants",
			"e.max_participants AS max_participants",
			"p.status AS perticipation_status",
			"p.guest_count AS guest_count",
		).
			Column(sq.Expr("? AS status", status)).
			From(r.table+" e").
			LeftJoin("event_types et ON e.event_type_id = et.id").
			LeftJoin("participants p ON e.id = p.event_id AND p.user_id = ?", userId)
	}
}

// GetAutoCreateEventTemplates is the worker's scan: every active event flagged
// should_auto_create_event, joined with its type's recurrence settings and the
// last occurrence slot already materialized for it.
func (r *eventRepo) GetAutoCreateEventTemplates(ctx context.Context) ([]entity.AutoCreateEventTemplate, error) {
	query, args, err := r.psql.Select(
		"e.id",
		"e.title",
		"COALESCE(e.description, '') AS description",
		"e.event_type_id",
		"e.start_at",
		// registration dates are nullable — a NULL scans as an error into
		// time.Time and would abort the whole worker tick, so coalesce to
		// start_at (registration opens/closes when the event starts).
		"COALESCE(e.registration_opens_at, e.start_at) AS registration_opens_at",
		"COALESCE(e.registration_closes_at, e.start_at) AS registration_closes_at",
		"e.max_participants",
		"e.remarks",
		"ets.recurrence",
		"ets.auto_create_at",
		"COALESCE(occ.last_done, e.start_at::date) AS last_done",
		"COALESCE(occ.has_occurrence, false) AS has_occurrence",
	).
		From(r.table + " e").
		Join("event_type_settings ets ON ets.event_type_id = e.event_type_id AND ets.is_active = true").
		LeftJoin("LATERAL (SELECT MAX(o.scheduled_date) AS last_done, COUNT(o.id) > 0 AS has_occurrence FROM event_occurrences o WHERE o.event_id = e.id) occ ON true").
		Where(sq.Eq{
			"e.should_auto_create_event": true,
			"e.is_active":                true,
			"e.is_deleted":               false,
		}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build auto create templates query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var templates []entity.AutoCreateEventTemplate
	if err := r.db.SelectContext(ctx, &templates, query, args...); err != nil {
		slog.Error("Failed to select auto create templates", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	return templates, nil
}

// GetTotalAutoCreateEvents counts events currently flagged for auto creation.
func (r *eventRepo) GetTotalAutoCreateEvents(ctx context.Context) (int, error) {
	query, args, err := r.psql.Select("COUNT(id)").
		From(r.table).
		Where(sq.Eq{
			"should_auto_create_event": true,
			"is_active":                true,
			"is_deleted":               false,
		}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build count query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return 0, err
	}

	var total int
	if err := r.db.GetContext(ctx, &total, query, args...); err != nil {
		slog.Error("Failed to count auto create events", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return 0, err
	}

	return total, nil
}

func (r *eventRepo) UpdateShouldAutoCreateEventStatus(ctx context.Context, tx *sqlx.Tx, id int, shouldAutoCreateEvent bool) error {

	query, args, err := r.psql.
		Update(r.table).
		Set("should_auto_create_event", shouldAutoCreateEvent).
		Where(sq.Eq{"id": id}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"id":    id,
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

// CreateEventInTx inserts a worker-created occurrence clone inside the same
// transaction that claimed the occurrence slot, so a crash can never leave a
// clone without its log row (or vice versa). A clone is never itself a
// template, so should_auto_create_event is always false here.
func (r *eventRepo) CreateEventInTx(ctx context.Context, tx *sqlx.Tx, req entity.Events, systemUserID int) error {
	if tx == nil {
		return errors.New("transaction is required for CreateEventInTx")
	}

	query, args, err := r.psql.Insert(r.table).
		Columns(
			"title", "description", "event_type_id", "start_at",
			"registration_opens_at", "registration_closes_at",
			"should_auto_create_event", "max_participants",
			"created_by", "created_at", "updated_at", "is_active", "updated_by",
			"remarks",
		).
		Values(
			req.Title, req.Description, req.EventTypeId, req.StartAt,
			req.RegistrationOpensAt, req.RegistrationClosesAt,
			false, req.MaxParticipants, systemUserID, time.Now(), time.Now(), true, systemUserID,
			req.Remarks,
		).
		ToSql()
	if err != nil {
		slog.Error("Failed to build insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	if _, err := tx.ExecContext(ctx, query, args...); err != nil {
		slog.Error("Failed to execute insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return err
	}

	return nil
}
