package repo

import (
	"context"
	"database/sql"
	"errors"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/rbac"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type UserRepo interface {
	rbac.UserRepo
	middlewares.UserRepo
}

type userRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewUserRepo(db *DB) UserRepo {
	return &userRepo{
		table: "users",
		db:    db.Db,
		psql:  db.Psql,
	}
}

func (r *userRepo) Create(ctx context.Context, req rbac.RegisterUserReq) (int, error) {
	query, args, err := r.psql.Insert(r.table).
		Columns("email", "pass", "first_name", "last_name", "is_active", "created_at", "updated_at").
		Values(req.Email, req.Password, req.FirstName, req.LastName, req.IsActive, req.CreatedAt, req.CreatedAt).
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

func (r *userRepo) Get(ctx context.Context, email string) (*entity.Users, error) {
	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"email": email}).
		Where(sq.Eq{"is_active": true}).
		ToSql()
	if err != nil {
		return nil, err
	}

	var user entity.Users
	if err := r.db.GetContext(ctx, &user, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("failed to get user", logger.Extra(map[string]any{
			"err":   err.Error(),
			"email": email,
		}))
		return nil, err
	}

	return &user, nil
}

func (r *userRepo) GetOne(ctx context.Context, id int) (*entity.Users, error) {
	query, args, err := r.psql.
		Select("*").
		From(r.table).
		Where(sq.Eq{"id": id}).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
			"id":    id,
		}))
		return nil, err
	}

	var user entity.Users
	if err := r.db.GetContext(ctx, &user, query, args...); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		slog.Error("failed to get user", logger.Extra(map[string]any{
			"err": err.Error(),
			"id":  id,
		}))
		return nil, err
	}

	return &user, nil
}

func (r *userRepo) GetUserPermission(ctx context.Context, userId int) ([]string, error) {
	query, args, err := NewQueryBuilder(r.getRoleWisePermissionQueryBuilder()).
		FilterByIntEq("uhr.user_id", userId).
		ToSql()

	if err != nil {
		slog.ErrorContext(ctx, "Failed to create role-wise permission query", logger.Extra(map[string]any{
			"error":  err.Error(),
			"userId": userId,
		}))
		return nil, err
	}

	var res []string
	if err := r.db.SelectContext(ctx, &res, query, args...); err != nil {
		slog.ErrorContext(ctx, "Failed to execute role-wise permission query", logger.Extra(map[string]any{
			"error": err.Error(),
			"query": query,
			"args":  args,
		}))
		return nil, err
	}

	return res, nil
}

func (r *userRepo) getRoleWisePermissionQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"p.name",
		).
			From("permissions AS p").
			Join("role_permissions AS rhp ON rhp.permission_id = p.id").
			Join("user_roles AS uhr ON uhr.role_id = rhp.role_id")
	}
}

func (r *userRepo) GetUsers(ctx context.Context, email string) ([]rbac.Users, error) {
	query, args, err := NewQueryBuilder(r.getUsersWithRolesQueryBuilder()).
		FilterByFullText("u.email", email).
		Limit(50).
		ToSql()
	if err != nil {
		slog.Error("Failed to build query", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	type UserRoleResult struct {
		UserId        int       `db:"user_id"`
		UserName      string    `db:"user_name"`
		UserEmail     string    `db:"user_email"`
		UserIsActive  bool      `db:"user_is_active"`
		UserCreatedAt time.Time `db:"user_created_at"`
		RoleId        *int      `db:"role_id"`
		RoleName      *string   `db:"role_name"`
		RoleIsActive  *bool     `db:"role_is_active"`
	}

	var results []UserRoleResult
	if err := r.db.SelectContext(ctx, &results, query, args...); err != nil {
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

	userMap := make(map[int]*rbac.Users)
	for _, result := range results {
		user, exists := userMap[result.UserId]
		if !exists {
			user = &rbac.Users{
				Id:        result.UserId,
				Name:      result.UserName,
				Email:     result.UserEmail,
				IsActive:  result.UserIsActive,
				CreatedAt: result.UserCreatedAt,
				Roles:     []rbac.Roles{},
			}
			userMap[result.UserId] = user
		}

		if result.RoleId != nil && result.RoleName != nil && result.RoleIsActive != nil {
			role := rbac.Roles{
				Id:       *result.RoleId,
				Name:     *result.RoleName,
				IsActive: *result.RoleIsActive,
			}
			user.Roles = append(user.Roles, role)
		}
	}

	users := make([]rbac.Users, 0, len(userMap))
	for _, user := range userMap {
		users = append(users, *user)
	}

	return users, nil
}

func (r *userRepo) getUsersWithRolesQueryBuilder() BuildQuery {
	return func() sq.SelectBuilder {
		return r.psql.Select(
			"u.id as user_id",
			"CONCAT(u.first_name, ' ', u.last_name) as user_name",
			"u.email as user_email",
			"u.is_active as user_is_active",
			"u.created_at as user_created_at",
			"r.id as role_id",
			"r.name as role_name",
			"r.is_active as role_is_active",
		).
			From(r.table + " AS u").
			LeftJoin("user_roles AS ur ON ur.user_id = u.id").
			LeftJoin("roles AS r ON r.id = ur.role_id AND r.is_active = true").
			OrderBy("u.id, r.id")
	}
}

func (s *userRepo) UpdatePassword(ctx context.Context, userId int, newPassword string) error {
	query, args, err := s.psql.Update(s.table).
		Set("pass", newPassword).
		Where(sq.Eq{"id": userId}).
		ToSql()
	if err != nil {
		slog.ErrorContext(ctx, "Failed to build update password query", logger.Extra(map[string]any{
			"error":   err.Error(),
			"user_id": userId,
		}))
		return err
	}

	if _, err := s.db.ExecContext(ctx, query, args...); err != nil {
		slog.ErrorContext(ctx, "Failed to execute update password query", logger.Extra(map[string]any{
			"error":   err.Error(),
			"query":   query,
			"args":    args,
			"user_id": userId,
		}))
		return err
	}

	return nil
}
