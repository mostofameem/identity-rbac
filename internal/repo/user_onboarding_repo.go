package repo

import (
	"context"
	"database/sql"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/rbac"
	"identity-rbac/pkg/logger"
	"log/slog"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type UserOnboardingRepo interface {
	rbac.UserOnboardingRepo
}

type userOnboardingRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewUserOnboardingRepo(db *DB) UserOnboardingRepo {
	return &userOnboardingRepo{
		table: "user_onboarding_process",
		db:    db.Db,
		psql:  sq.StatementBuilder.PlaceholderFormat(sq.Question),
	}
}

func (r *userOnboardingRepo) GetUserOnboarding(ctx context.Context, email string) (*entity.UserOnboarding, error) {
	query, args, err := r.psql.Select("id", "email", "role_ids", "status", "completed", "expired_at", "created_at").
		From(r.table).
		Where(sq.Eq{"email": email}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build user onboarding query", logger.Extra(map[string]any{
			"error": err.Error(),
			"email": email,
		}))
		return nil, err
	}

	var userOnboarding entity.UserOnboarding
	err = r.db.GetContext(ctx, &userOnboarding, query, args...)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		slog.Error("Failed to get user onboarding", logger.Extra(map[string]any{
			"error": err.Error(),
			"email": email,
			"query": query,
			"args":  args,
		}))
		return nil, err
	}

	return &userOnboarding, nil
}
