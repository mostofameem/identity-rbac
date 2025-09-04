package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/rbac"
	"identity-rbac/pkg/logger"
	"log/slog"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type UserSessionRepo interface {
	rbac.UserSessionRepo
}

type userSessionRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewUserSessionRepo(db *DB) UserSessionRepo {
	return &userSessionRepo{
		table: "user_sessions",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *userSessionRepo) Create(ctx context.Context, req rbac.CreateUserSessionReq) (int, error) {
	query, args, err := r.psql.Insert(r.table).
		Columns("user_id", "jti", "ip_address", "user_agent", "expires_at", "created_at", "updated_at", "is_active").
		Values(req.UserId, req.Jti, req.IpAddress, req.UserAgent, req.ExpiresAt, req.CreatedAt, req.UpdatedAt, true).
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

func (r *userSessionRepo) GetByJti(ctx context.Context, jti string) (*entity.UserSession, error) {
	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"jti": jti}).
		Where(sq.Eq{"is_active": true}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
			"jti":   jti,
		}))
		return nil, err
	}

	var session entity.UserSession
	if err := r.db.GetContext(ctx, &session, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("failed to get user session", logger.Extra(map[string]any{
			"err": err.Error(),
			"jti": jti,
		}))
		return nil, err
	}

	return &session, nil
}

func (r *userSessionRepo) GetByUserId(ctx context.Context, userId int) ([]entity.UserSession, error) {
	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"user_id": userId}).
		Where(sq.Eq{"is_active": true}).
		OrderBy("created_at DESC").
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error":   err.Error(),
			"user_id": userId,
		}))
		return nil, err
	}

	var sessions []entity.UserSession
	if err := r.db.SelectContext(ctx, &sessions, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []entity.UserSession{}, nil
		}

		slog.Error("failed to get user sessions", logger.Extra(map[string]any{
			"err":     err.Error(),
			"user_id": userId,
		}))
		return nil, err
	}

	return sessions, nil
}

func (r *userSessionRepo) DeactivateSession(ctx context.Context, sessionId int) error {
	query, args, err := r.psql.Update(r.table).
		Set("is_active", false).
		Set("updated_at", "CURRENT_TIMESTAMP").
		Where(sq.Eq{"id": sessionId}).
		ToSql()
	if err != nil {
		slog.ErrorContext(ctx, "Failed to build deactivate session query", logger.Extra(map[string]any{
			"error":      err.Error(),
			"session_id": sessionId,
		}))
		return err
	}

	if _, err := r.db.ExecContext(ctx, query, args...); err != nil {
		slog.ErrorContext(ctx, "Failed to execute deactivate session query", logger.Extra(map[string]any{
			"error":      err.Error(),
			"query":      query,
			"args":       args,
			"session_id": sessionId,
		}))
		return err
	}

	return nil
}

func (r *userSessionRepo) DeactivateAllUserSessions(ctx context.Context, userId int) error {
	query, args, err := r.psql.Update(r.table).
		Set("is_active", false).
		Set("updated_at", "CURRENT_TIMESTAMP").
		Where(sq.Eq{"user_id": userId}).
		Where(sq.Eq{"is_active": true}).
		ToSql()
	if err != nil {
		slog.ErrorContext(ctx, "Failed to build deactivate all user sessions query", logger.Extra(map[string]any{
			"error":   err.Error(),
			"user_id": userId,
		}))
		return err
	}

	if _, err := r.db.ExecContext(ctx, query, args...); err != nil {
		slog.ErrorContext(ctx, "Failed to execute deactivate all user sessions query", logger.Extra(map[string]any{
			"error":   err.Error(),
			"query":   query,
			"args":    args,
			"user_id": userId,
		}))
		return err
	}

	return nil
}

func (r *userSessionRepo) DeleteExpiredSessions(ctx context.Context) error {
	query, args, err := r.psql.Delete(r.table).
		Where(sq.Lt{"expires_at": "CURRENT_TIMESTAMP"}).
		ToSql()
	if err != nil {
		slog.ErrorContext(ctx, "Failed to build delete expired sessions query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	if _, err := r.db.ExecContext(ctx, query, args...); err != nil {
		slog.ErrorContext(ctx, "Failed to execute delete expired sessions query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return err
	}

	return nil
}
