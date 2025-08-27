package repo

import (
	"context"
	"database/sql"
	"encoding/json"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/rbac"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/google/uuid"
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
	query, args, err := r.psql.Select("id", "email", "role_ids", "status", "completed", "created_by", "expired_at", "created_at").
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

	type tempUserOnboarding struct {
		Id        string    `db:"id"`
		Email     string    `db:"email"`
		RoleIds   string    `db:"role_ids"` // JSON string
		Status    string    `db:"status"`
		Completed bool      `db:"completed"`
		CreatedBy int       `db:"created_by"`
		ExpiredAt time.Time `db:"expired_at"`
		CreatedAt time.Time `db:"created_at"`
	}

	var temp tempUserOnboarding
	err = r.db.GetContext(ctx, &temp, query, args...)
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

	// Convert to entity.UserOnboarding
	userOnboarding := &entity.UserOnboarding{
		Id:        temp.Id,
		Email:     temp.Email,
		RoleIds:   temp.RoleIds, // Keep as string for entity
		Status:    temp.Status,
		Completed: temp.Completed,
		CreatedBy: temp.CreatedBy,
		ExpiredAt: temp.ExpiredAt,
		CreatedAt: temp.CreatedAt,
	}

	return userOnboarding, nil
}

func (r *userOnboardingRepo) Create(ctx context.Context, req *rbac.UserOnboardingProcess) error {
	req.Id = uuid.New().String()

	roleIdsJSON, err := json.Marshal(req.RoleIds)
	if err != nil {
		slog.Error("Failed to marshal role IDs", logger.Extra(map[string]any{
			"error":   err.Error(),
			"roleIds": req.RoleIds,
		}))
		return err
	}

	query, args, err := r.psql.Insert(r.table).
		Columns("id", "email", "role_ids", "status", "completed", "created_by", "expired_at", "created_at").
		Values(req.Id, req.Email, string(roleIdsJSON), req.Status, req.Completed, req.CreatedBy, req.ExpiredAt, req.CreatedAt).
		ToSql()
	if err != nil {
		slog.Error("Failed to build user onboarding insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	_, err = r.db.ExecContext(ctx, query, args...)
	if err != nil {
		slog.Error("Failed to insert user onboarding process", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return err
	}

	return nil
}
