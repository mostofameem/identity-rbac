package repo

import (
	"context"
	"errors"
	"identity-rbac/internal/rbac"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"

	"github.com/go-sql-driver/mysql"
)

func (r *userRepo) CreateUserWithRoleTx(ctx context.Context, req rbac.CreateUserReq) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		slog.Error("Failed to start transaction", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	query, args, err := r.psql.Insert(r.table).
		Columns("email", "pass", "is_active", "created_at", "updated_at").
		Values(req.Email, req.Pass, req.IsActive, req.CreatedAt, req.CreatedAt).
		ToSql()
	if err != nil {
		slog.Error("Failed to build user insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	result, err := tx.ExecContext(ctx, query, args...)
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return util.ErrDuplicateRow
		}

		slog.Error("Failed to insert user", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  req,
		}))
		return err
	}

	userId, err := result.LastInsertId()
	if err != nil {
		slog.Error("Failed to get last insert ID", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	roleQuery, roleArgs, err := r.psql.Insert("user_has_roles").
		Columns("user_id", "role_id", "added_by", "created_at").
		Values(userId, req.RoleId, req.CreatedBy, req.CreatedAt).
		ToSql()
	if err != nil {
		slog.Error("Failed to build user_has_roles insert", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	if _, err := tx.ExecContext(ctx, roleQuery, roleArgs...); err != nil {
		slog.Error("Failed to insert user_has_roles", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": roleQuery,
			"args":  req,
		}))
		return err
	}

	if err := tx.Commit(); err != nil {
		slog.Error("Failed to commit transaction", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	return nil
}

func (r *userRepo) CreateUserWithMultipleRolesTx(ctx context.Context, req rbac.CreateUserV2Req) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		slog.Error("Failed to start transaction", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	query, args, err := r.psql.Insert(r.table).
		Columns("email", "pass", "is_active", "created_at", "updated_at").
		Values(req.Email, req.Pass, req.IsActive, req.CreatedAt, req.CreatedAt).
		ToSql()
	if err != nil {
		slog.Error("Failed to build user insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	result, err := tx.ExecContext(ctx, query, args...)
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return util.ErrAlreadyRegistered
		}

		slog.Error("Failed to insert user", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  req,
		}))
		return err
	}

	userId, err := result.LastInsertId()
	if err != nil {
		slog.Error("Failed to get last insert ID", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	// Insert multiple roles for the user
	for _, roleId := range req.RoleIds {
		roleQuery, roleArgs, err := r.psql.Insert("user_has_roles").
			Columns("user_id", "role_id", "added_by", "created_at").
			Values(userId, roleId, req.CreatedBy, req.CreatedAt).
			ToSql()
		if err != nil {
			slog.Error("Failed to build user_has_roles insert", logger.Extra(map[string]any{
				"error": err.Error(),
				"req":   req,
			}))
			return err
		}

		if _, err := tx.ExecContext(ctx, roleQuery, roleArgs...); err != nil {
			slog.Error("Failed to insert user_has_roles", logger.Extra(map[string]any{
				"error": err.Error(),
				"query": roleQuery,
				"args":  req,
			}))
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		slog.Error("Failed to commit transaction", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	return nil
}
