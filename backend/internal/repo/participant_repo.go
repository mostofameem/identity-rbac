package repo

import (
	"context"
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
		slog.Error("Failed to execute select query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return false, err
	}

	return exists > 0, nil
}
