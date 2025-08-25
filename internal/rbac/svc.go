package rbac

import (
	"identity-rbac/config"
)

type service struct {
	cnf                   *config.Config
	userRepo              UserRepo
	roleRepo              RoleRepo
	permissionRepo        PermissionRepo
	userHasRoleRepo       UserHasRoleRepo
	roleHasPermissionRepo RoleHasPermissionRepo
}

func NewService(
	cnf *config.Config,
	userRepo UserRepo,
	roleRepo RoleRepo,
	permissionRepo PermissionRepo,
	userHasRoleRepo UserHasRoleRepo,
	roleHasPermissionRepo RoleHasPermissionRepo,
) Service {
	return &service{
		cnf:                   cnf,
		userRepo:              userRepo,
		roleRepo:              roleRepo,
		permissionRepo:        permissionRepo,
		userHasRoleRepo:       userHasRoleRepo,
		roleHasPermissionRepo: roleHasPermissionRepo,
	}
}
