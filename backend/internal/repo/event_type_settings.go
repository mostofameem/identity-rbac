package repo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/event"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type EventTypeSettingRepo interface {
	event.EventTypeSettingRepo
}

type eventTypeSettingRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewEventTypeSettingRepo(db *DB) EventTypeSettingRepo {
	return &eventTypeSettingRepo{
		table: "event_type_settings",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (repo *eventTypeSettingRepo) CreateOrUpsert(ctx context.Context, req event.EventTypeSettingsRequest) (int, error) {
	// First try to update existing record
	updateQuery, updateArgs, err := repo.psql.Update(repo.table).
		Set("auto_create_at", req.AutoCreateAt).
		Set("auto_event_interval_in_minutes", req.AutoEventIntervalInMinutes).
		Set("updated_by", req.RequestBy).
		Set("remarks", req.Remarks).
		Set("is_active", req.IsActive).
		Set("updated_at", time.Now()).
		Where(sq.Eq{"event_type_id": req.EventTypeId}).
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		slog.Error("Failed to build update query", "error", err)
		return 0, fmt.Errorf("failed to build update query: %w", err)
	}

	// Try to update first
	var id int
	err = repo.db.QueryRowContext(ctx, updateQuery, updateArgs...).Scan(&id)
	if err == nil {
		// Update successful, return the ID
		return id, nil
	}

	// If no rows were updated, insert a new record
	if errors.Is(err, sql.ErrNoRows) {
		insertQuery, insertArgs, ierr := repo.psql.Insert(repo.table).
			Columns(
				"event_type_id",
				"auto_create_at",
				"auto_event_interval_in_minutes",
				"created_by",
				"updated_by",
				"remarks",
				"created_at",
				"updated_at",
				"is_active",
			).
			Values(
				req.EventTypeId,
				req.AutoCreateAt, // This is now a string in HH:MM format
				req.AutoEventIntervalInMinutes,
				req.RequestBy,
				req.RequestBy,
				req.Remarks,
				time.Now(),
				time.Now(),
				req.IsActive, // Default is_active to true for new records
			).
			Suffix("RETURNING id").
			ToSql()

		if ierr != nil {
			slog.Error("Failed to build insert query", "error", ierr)
			return 0, fmt.Errorf("failed to build insert query: %w", ierr)
		}

		if err := repo.db.QueryRowContext(ctx, insertQuery, insertArgs...).Scan(&id); err != nil {
			slog.Error("Failed to insert event type setting", "error", err)
			return 0, fmt.Errorf("failed to insert event type setting: %w", err)
		}

		return id, nil
	}

	// If we got here, there was an error with the update that wasn't ErrNoRows
	return 0, fmt.Errorf("failed to update event type setting: %w", err)
}

// GetByEventTypeID retrieves event type settings by event type ID
// Returns default EventTypeSettingsRequest with zero values if not found
func (repo *eventTypeSettingRepo) GetByEventTypeID(ctx context.Context, eventTypeID int) (*entity.EventTypeSettings, error) {
	query, args, err := repo.psql.Select(
		"id",
		"event_type_id",
		"auto_create_at",
		"auto_event_interval_in_minutes",
		"created_by",
		"updated_by",
		"remarks",
		"is_active",
	).
		From(repo.table).
		Where(sq.Eq{"event_type_id": eventTypeID}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	var settings entity.EventTypeSettings
	err = repo.db.GetContext(ctx, &settings, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, util.ErrNotFound
		}

		return nil, fmt.Errorf("failed to get event type settings: %w", err)
	}

	return &settings, nil
}

func (repo *eventTypeSettingRepo) Create(ctx context.Context, req event.EventTypeSettingsRequest) (int, error) {

	insertQuery, insertArgs, ierr := repo.psql.Insert(repo.table).
		Columns(
			"event_type_id",
			"auto_create_at",
			"auto_event_interval_in_minutes",
			"created_by",
			"updated_by",
			"remarks",
			"created_at",
			"updated_at",
			"is_active",
		).
		Values(
			req.EventTypeId,
			req.AutoCreateAt, // This is now a string in HH:MM format
			req.AutoEventIntervalInMinutes,
			req.RequestBy,
			req.RequestBy,
			req.Remarks,
			time.Now(),
			time.Now(),
			true, // Default is_active to true for new records
		).
		Suffix("RETURNING id").
		ToSql()

	var id int

	if ierr != nil {
		slog.Error("Failed to build insert query", "error", ierr)
		return 0, fmt.Errorf("failed to build insert query: %w", ierr)
	}

	if err := repo.db.QueryRowContext(ctx, insertQuery, insertArgs...).Scan(&id); err != nil {
		slog.Error("Failed to insert event type setting", "error", err)
		return 0, fmt.Errorf("failed to insert event type setting: %w", err)
	}

	return id, nil
}

func (repo *eventTypeSettingRepo) Update(ctx context.Context, req event.EventTypeSettingsRequest) (int, error) {
	// First try to update existing record
	updateQuery, updateArgs, err := repo.psql.Update(repo.table).
		Set("auto_create_at", req.AutoCreateAt).
		Set("auto_event_interval_in_minutes", req.AutoEventIntervalInMinutes).
		Set("updated_by", req.RequestBy).
		Set("remarks", req.Remarks).
		Set("is_active", req.IsActive).
		Set("updated_at", time.Now()).
		Where(sq.Eq{"event_type_id": req.EventTypeId}).
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		slog.Error("Failed to build update query", "error", err)
		return 0, fmt.Errorf("failed to build update query: %w", err)
	}

	var id int
	err = repo.db.QueryRowContext(ctx, updateQuery, updateArgs...).Scan(&id)
	if err != nil {
		slog.Error("Failed to update event settings", logger.Extra(map[string]any{
			"event_type_id": req.EventTypeId,
			"error":         err,
		}))
		return 0, util.ErrSomethingWentWrong
	}

	return id, nil
}
