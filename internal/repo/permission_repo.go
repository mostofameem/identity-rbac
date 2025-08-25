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

type PermissionRepo interface {
	rbac.PermissionRepo
}

type permissionRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewPermissionRepo(db *DB) PermissionRepo {
	return &permissionRepo{
		table: "permissions",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *permissionRepo) Create(ctx context.Context, req rbac.AddPermission) (int, error) {
	var id int64

	query, args, err := r.psql.Insert(r.table).
		Columns("name", "operations", "created_by", "created_at").
		Values(req.Name, req.Operations, req.CreatedBy, req.CreatedAt).
		ToSql()
	if err != nil {
		slog.Error("Failed to build insert query", logger.Extra(map[string]any{
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

func (r *permissionRepo) Get(ctx context.Context, title string) (*[]rbac.Permissions, error) {
	query, args, err := NewQueryBuilder(r.getPermissionsQueryBuilder()).
		FilterByFullText("name", title).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var permissions []rbac.Permissions
	if err := r.db.SelectContext(ctx, &permissions, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			slog.Warn("no row found", logger.Extra(map[string]any{
				"error": err.Error(),
			}))
			return nil, nil
		}

		slog.Error("Failed to execute query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
		}))
		return nil, err
	}

	return &permissions, nil
}

func (r *permissionRepo) getPermissionsQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"id",
			"name",
		).
			From(r.table)
	}
}

func (r *permissionRepo) GetOne(ctx context.Context, id int) (*entity.Permission, error) {
	query, args, err := r.psql.Select("*").
		From(r.table).
		Where(sq.Eq{"id": id}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var permission entity.Permission
	if err := r.db.GetContext(ctx, &permission, query, args...); err != nil {
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

	return &permission, nil
}
