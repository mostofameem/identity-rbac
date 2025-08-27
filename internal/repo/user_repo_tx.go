package repo

import (
	"context"
	"fmt"
	"identity-rbac/internal/rbac"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"

	sq "github.com/Masterminds/squirrel"
	"github.com/lib/pq"
)

func (r *userRepo) CreateUserWithMultipleRolesTx(ctx context.Context, req rbac.RegisterUserReq) error {
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
		Columns("email", "password", "first_name", "last_name", "is_active", "created_at", "updated_at").
		Values(req.Email, req.Password, req.FirstName, req.LastName, req.IsActive, req.CreatedAt, req.CreatedAt).
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		slog.Error("Failed to build user insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	var userId int64
	if err := tx.QueryRowContext(ctx, query, args...).Scan(&userId); err != nil {
		if pgErr, ok := err.(*pq.Error); ok && pgErr.Code == "23505" {
			return util.ErrAlreadyRegistered
		}

		slog.Error("Failed to insert user", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  req,
		}))
		return err
	}

	for _, roleId := range req.RoleIds {
		roleQuery, roleArgs, err := r.psql.Insert("user_roles").
			Columns("user_id", "role_id", "added_by", "is_active", "created_at", "updated_at").
			Values(userId, roleId, req.CreatedBy, true, req.CreatedAt, req.CreatedAt).
			ToSql()
		if err != nil {
			slog.Error("Failed to build user_roles insert", logger.Extra(map[string]any{
				"error": err.Error(),
				"req":   req,
			}))
			return err
		}

		if _, err := tx.ExecContext(ctx, roleQuery, roleArgs...); err != nil {
			if pgErr, ok := err.(*pq.Error); ok && pgErr.Code == "23505" {
				return fmt.Errorf("user already has role %d: %w", roleId, err)
			}

			slog.Error("Failed to insert user_roles", logger.Extra(map[string]any{
				"error": err.Error(),
				"query": roleQuery,
				"args":  req,
			}))
			return err
		}
	}

	onboardingQuery, onboardingArgs, err := r.psql.Update("user_onboarding_process").
		Set("status", "COMPLETED").
		Set("completed", true).
		Where(sq.Eq{"email": req.Email}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build onboarding update query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	if _, err := tx.ExecContext(ctx, onboardingQuery, onboardingArgs...); err != nil {
		slog.Error("Failed to update onboarding status", logger.Extra(map[string]any{
			"error":     err.Error(),
			"query":     onboardingQuery,
			"args":      onboardingArgs,
			"email":     req.Email,
			"status":    "COMPLETED",
			"completed": true,
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
