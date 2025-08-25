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

type RoleRepo interface {
	rbac.RoleRepo
}

type roleRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewRoleRepo(db *DB) RoleRepo {
	return &roleRepo{
		table: "roles",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *roleRepo) Create(ctx context.Context, req rbac.AddRole) (int, error) {
	var id int64

	query, args, err := r.psql.Insert(r.table).
		Columns("name", "description", "created_by", "created_at").
		Values(req.Name, req.Description, req.CreatedBy, req.CreatedAt).
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

func (r *roleRepo) Get(ctx context.Context, title string) ([]rbac.Roles, error) {
	query, args, err := NewQueryBuilder(r.getRolesQueryBuilder()).
		FilterByFullText("name", title).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	var roles []rbac.Roles
	if err := r.db.SelectContext(ctx, &roles, query, args...); err != nil {
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

	return roles, nil
}

func (r *roleRepo) getRolesQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"id",
			"name",
		).
			From(r.table)
	}
}

func (r *roleRepo) GetOne(ctx context.Context, id int) (*entity.Role, error) {
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

	var role entity.Role
	if err := r.db.GetContext(ctx, &role, query, args...); err != nil {
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

	return &role, nil
}

func (r *roleRepo) GetRolesWithPermissions(ctx context.Context, title string) ([]rbac.RolesWithPermissions, error) {
	// First get all roles
	roles, err := r.Get(ctx, title)
	if err != nil {
		return nil, err
	}

	var rolesWithPermissions []rbac.RolesWithPermissions

	for _, role := range roles {
		// Get permissions for each role
		permissions, err := r.getRolePermissions(ctx, role.Id)
		if err != nil {
			slog.Error("Failed to get permissions for role", logger.Extra(map[string]any{
				"roleId": role.Id,
				"error":  err.Error(),
			}))
			// Continue with other roles even if one fails
			permissions = []rbac.Permissions{}
		}

		// Get full role details including description and created_at
		fullRole, err := r.GetOne(ctx, role.Id)
		if err != nil {
			slog.Error("Failed to get full role details", logger.Extra(map[string]any{
				"roleId": role.Id,
				"error":  err.Error(),
			}))
			continue
		}

		rolesWithPermissions = append(rolesWithPermissions, rbac.RolesWithPermissions{
			Id:          role.Id,
			Name:        role.Name,
			Description: fullRole.Description,
			CreatedAt:   fullRole.CreatedAt,
			IsActive:    role.IsActive,
			Permissions: permissions,
		})
	}

	return rolesWithPermissions, nil
}

func (r *roleRepo) getRolePermissions(ctx context.Context, roleId int) ([]rbac.Permissions, error) {
	query := `
		SELECT p.id, p.name
		FROM permissions p
		INNER JOIN role_has_permissions rhp ON p.id = rhp.permission_id
		WHERE rhp.role_id = ?
		ORDER BY p.name
	`

	var permissions []rbac.Permissions
	if err := r.db.SelectContext(ctx, &permissions, query, roleId); err != nil {
		return nil, err
	}

	return permissions, nil
}

func (r *roleRepo) CreateRoleWithPermissionsTx(ctx context.Context, req rbac.AddRoleV2) error {
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

	// Insert the role first
	roleQuery, roleArgs, err := r.psql.Insert(r.table).
		Columns("name", "description", "created_by", "created_at").
		Values(req.Name, req.Description, req.CreatedBy, req.CreatedAt).
		ToSql()
	if err != nil {
		slog.Error("Failed to build role insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	result, err := tx.ExecContext(ctx, roleQuery, roleArgs...)
	if err != nil {
		slog.Error("Failed to insert role", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": roleQuery,
			"args":  req,
		}))
		return err
	}

	roleId, err := result.LastInsertId()
	if err != nil {
		slog.Error("Failed to get last insert ID", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	// Insert role-permission relationships
	for _, permissionId := range req.PermissionIDs {
		permissionQuery, permissionArgs, err := r.psql.Insert("role_has_permissions").
			Columns("role_id", "permission_id", "added_by", "created_at").
			Values(roleId, permissionId, req.CreatedBy, req.CreatedAt).
			ToSql()
		if err != nil {
			slog.Error("Failed to build role_has_permissions insert", logger.Extra(map[string]any{
				"error": err.Error(),
				"req":   req,
			}))
			return err
		}

		if _, err := tx.ExecContext(ctx, permissionQuery, permissionArgs...); err != nil {
			slog.Error("Failed to insert role_has_permissions", logger.Extra(map[string]any{
				"error": err.Error(),
				"query": permissionQuery,
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
