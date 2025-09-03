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

type RoleHasPermissionRepo interface {
	rbac.RoleHasPermissionRepo
}

type roleHasPermissionRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewRoleHasPermissionRepo(db *DB) RoleHasPermissionRepo {
	return &roleHasPermissionRepo{
		table: "role_permissions",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *roleHasPermissionRepo) Create(ctx context.Context, req rbac.AddPermissionToRole) (int, error) {
	query, args, err := r.psql.Insert(r.table).
		Columns("role_id", "permission_id", "added_by", "created_at").
		Values(req.RoleID, req.PermissionID, req.AddedBy, req.CreatedAt).
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
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

func (r *roleHasPermissionRepo) Get(ctx context.Context, roleId int) (*[]entity.RoleHasPermission, error) {
	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"role_id": roleId}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   roleId,
		}))
		return nil, err
	}

	var roleHasPermissions []entity.RoleHasPermission
	if err := r.db.SelectContext(ctx, &roleHasPermissions, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("Failed to execute query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  roleId,
		}))
		return nil, err
	}

	return &roleHasPermissions, nil
}

func (r *roleHasPermissionRepo) AddPermissionsToRole(ctx context.Context, req rbac.AddRolePermissions) error {
	queryBuilder := r.psql.Insert(r.table).
		Columns("role_id", "permission_id", "added_by", "created_at")

	for _, pid := range req.PermissionIDs {
		queryBuilder = queryBuilder.Values(req.RoleID, pid, req.AddedBy, req.CreatedAt)
	}

	query, args, err := queryBuilder.ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	_, err = r.db.ExecContext(ctx, query, args...)
	if err != nil {
		slog.Error("Failed to execute insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return err
	}

	return nil
}
