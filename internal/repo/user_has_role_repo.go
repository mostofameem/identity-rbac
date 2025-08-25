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

type UserHasRoleRepo interface {
	rbac.UserHasRoleRepo
}

type userHasRoleRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewUserHasRoleRepo(db *DB) UserHasRoleRepo {
	return &userHasRoleRepo{
		table: "user_has_roles",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *userHasRoleRepo) Create(ctx context.Context, req rbac.AddRoleToUser) (int, error) {
	var id int64

	query, args, err := r.psql.Insert(r.table).
		Columns("user_id", "role_id", "added_by", "created_at").
		Values(req.UserID, req.RoleID, req.AddedBy, req.CreatedAt).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return 0, err
	}

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		slog.Error("Failed to execute insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  req,
		}))
		return 0, err
	}

	id, err = result.LastInsertId()
	if err != nil {
		slog.Error("Failed to get last insert ID", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return 0, err
	}

	return int(id), nil
}

func (r *userHasRoleRepo) Get(ctx context.Context, userId int) (*[]entity.UserHasRole, error) {
	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"user_id": userId}).
		ToSql()
	if err != nil {
		return nil, err
	}

	var userHasRole []entity.UserHasRole
	if err := r.db.SelectContext(ctx, &userHasRole, query, args...); err != nil {
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

	return &userHasRole, nil
}
