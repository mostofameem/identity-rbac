package middlewares

import (
	"context"
	"identity-rbac/config"
)

type UserRepo interface {
	GetUserPermission(ctx context.Context, userId int) ([]string, error)
}

type RoleRepo interface {
}

type PermissionRepo interface {
}

type RoleHasPermissionRepo interface {
}

type UserHasRoleRepo interface {
	//Get(context.Context, int) ([]*entity.UserHasRole, error)
}
type Middleware struct {
	cnf                   *config.Config
	userRepo              UserRepo
	roleRepo              RoleRepo
	permissionRepo        PermissionRepo
	roleHasPermissionRepo RoleHasPermissionRepo
	userHasRoleRepo       UserHasRoleRepo
}

func NewMiddleware(
	cnf *config.Config,
	userRepo UserRepo,
	roleRepo RoleRepo,
	permissionRepo PermissionRepo,
	roleHasPermissionRepo RoleHasPermissionRepo,
	userHasRoleRepo UserHasRoleRepo,
) *Middleware {
	return &Middleware{
		cnf:                   cnf,
		userRepo:              userRepo,
		roleRepo:              roleRepo,
		permissionRepo:        permissionRepo,
		roleHasPermissionRepo: roleHasPermissionRepo,
		userHasRoleRepo:       userHasRoleRepo,
	}
}
