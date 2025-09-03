package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/rbac"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

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
	query, args, err := r.psql.Insert(r.table).
		Columns("name", "description", "created_by", "is_active", "created_at").
		Values(req.Name, req.Description, req.CreatedBy, req.IsActive, req.CreatedAt).
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
			"is_active",
		).
			From(r.table)
	}
}

func (r *roleRepo) getRolesWithPermissionsQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"r.id",
			"r.name",
			"r.description",
			"r.is_active",
			"r.created_at",
			"p.id as permission_id",
			"p.name as permission_name",
			"p.resource as permission_resource",
			"p.action as permission_action",
			"p.description as permission_description",
		).
			From("roles r").
			LeftJoin("role_permissions rp ON r.id = rp.role_id AND rp.is_active = true").
			LeftJoin("permissions p ON rp.permission_id = p.id AND p.is_active = true").
			Where(sq.Eq{"r.is_active": true}).
			OrderBy("r.id", "p.name")
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
	query, args, err := NewQueryBuilder(r.getRolesWithPermissionsQueryBuilder()).
		FilterByFullText("r.name", title).
		ToSql()

	if err != nil {
		slog.Error("Failed to build roles with permissions query", logger.Extra(map[string]any{
			"error": err.Error(),
			"title": title,
		}))
		return nil, err
	}

	type rolePermissionRow struct {
		Id                    int       `db:"id"`
		Name                  string    `db:"name"`
		Description           string    `db:"description"`
		IsActive              bool      `db:"is_active"`
		CreatedAt             time.Time `db:"created_at"`
		PermissionId          *int      `db:"permission_id"`
		PermissionName        *string   `db:"permission_name"`
		PermissionResource    *string   `db:"permission_resource"`
		PermissionAction      *string   `db:"permission_action"`
		PermissionDescription *string   `db:"permission_description"`
	}

	var rows []rolePermissionRow
	if err := r.db.SelectContext(ctx, &rows, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []rbac.RolesWithPermissions{}, nil
		}
		slog.Error("Failed to execute roles with permissions query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return nil, err
	}

	roleMap := make(map[int]*rbac.RolesWithPermissions)

	for _, row := range rows {
		// Create or get existing role
		if _, exists := roleMap[row.Id]; !exists {
			roleMap[row.Id] = &rbac.RolesWithPermissions{
				Id:          row.Id,
				Name:        row.Name,
				Description: row.Description,
				IsActive:    row.IsActive,
				CreatedAt:   row.CreatedAt,
				Permissions: []rbac.Permissions{},
			}
		}

		// Add permission if it exists (not null)
		if row.PermissionId != nil {
			permission := rbac.Permissions{
				Id:          *row.PermissionId,
				Name:        *row.PermissionName,
				Resource:    *row.PermissionResource,
				Action:      *row.PermissionAction,
				Description: *row.PermissionDescription,
			}
			roleMap[row.Id].Permissions = append(roleMap[row.Id].Permissions, permission)
		}
	}

	// Convert map to slice
	var rolesWithPermissions []rbac.RolesWithPermissions
	for _, role := range roleMap {
		rolesWithPermissions = append(rolesWithPermissions, *role)
	}

	return rolesWithPermissions, nil
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
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		slog.Error("Failed to build role insert query", logger.Extra(map[string]any{
			"error": err.Error(),
			"req":   req,
		}))
		return err
	}

	var roleId int
	err = tx.QueryRowContext(ctx, roleQuery, roleArgs...).Scan(&roleId)
	if err != nil {
		slog.Error("Failed to insert role", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": roleQuery,
			"args":  req,
		}))
		return err
	}

	// Insert role-permission relationships
	for _, permissionId := range req.PermissionIDs {
		permissionQuery, permissionArgs, err := r.psql.Insert("role_permissions").
			Columns("role_id", "permission_id", "added_by", "created_at").
			Values(roleId, permissionId, req.CreatedBy, req.CreatedAt).
			ToSql()
		if err != nil {
			slog.Error("Failed to build role_permissions insert", logger.Extra(map[string]any{
				"error": err.Error(),
				"req":   req,
			}))
			return err
		}

		if _, err := tx.ExecContext(ctx, permissionQuery, permissionArgs...); err != nil {
			slog.Error("Failed to insert role_permissions", logger.Extra(map[string]any{
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
