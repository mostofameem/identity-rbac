package rbac

import (
	"context"
	"identity-rbac/internal/entity"
)

type Service interface {
	CreateUserWithMultipleRoles(ctx context.Context, req RegisterUserReq) error
	Login(ctx context.Context, params LoginParams) (string, string, error)
	LoginV2(ctx context.Context, params LoginParams) (string, string, []string, error)
	AuthLogin(ctx context.Context, email string) (string, string, error)

	GetUsers(ctx context.Context, email string) ([]Users, error)
	ResetPassword(ctx context.Context, req ResetPasswordReq) error

	CreateNewRole(context.Context, *AddRole) error
	CreateNewRoleV2(context.Context, *AddRoleV2) error
	GetRoles(ctx context.Context, title string) ([]Roles, error)
	GetRolesWithPermissions(ctx context.Context, title string) ([]RolesWithPermissions, error)

	GetPermissions(ctx context.Context, title string) (*[]Permissions, error)

	AddRoleToUser(context.Context, *AddRoleToUser) error

	AddPermissionToRole(context.Context, *AddPermissionToRole) error
	GetUserPermission(ctx context.Context, userId int) ([]string, error)
	GetAccessTokenFromRefreshToken(ctx context.Context, refreshToken string) (string, error)
}

type UserRepo interface {
	Create(ctx context.Context, req RegisterUserReq) (int, error)
	Get(ctx context.Context, email string) (*entity.Users, error)
	GetOne(ctx context.Context, id int) (*entity.Users, error)
	GetUserPermission(ctx context.Context, userId int) ([]string, error)
	GetUsers(ctx context.Context, email string) ([]Users, error)
	CreateUserWithMultipleRolesTx(ctx context.Context, req RegisterUserReq) error
	UpdatePassword(ctx context.Context, userId int, newPassword string) error
}

type RoleRepo interface {
	Create(ctx context.Context, req AddRole) (int, error)
	CreateRoleWithPermissionsTx(ctx context.Context, req AddRoleV2) error
	Get(ctx context.Context, title string) ([]Roles, error)
	GetRolesWithPermissions(ctx context.Context, title string) ([]RolesWithPermissions, error)
	GetOne(ctx context.Context, id int) (*entity.Role, error)
}

type UserHasRoleRepo interface {
	Create(ctx context.Context, req AddRoleToUser) (int, error)
	Get(ctx context.Context, uid int) (*[]entity.UserHasRole, error)
}

type PermissionRepo interface {
	Get(ctx context.Context, title string) (*[]Permissions, error)
	GetOne(ctx context.Context, id int) (*entity.Permission, error)
}

type RoleHasPermissionRepo interface {
	Create(ctx context.Context, req AddPermissionToRole) (int, error)
	Get(ctx context.Context, roleId int) (*[]entity.RoleHasPermission, error)
	AddPermissionsToRole(ctx context.Context, req AddRolePermissions) error
}

type UserOnboardingRepo interface {
	//OnboardUser(ctx context.Context, req rbac.RegisterUserReq) error
	GetUserOnboarding(ctx context.Context, email string) (*entity.UserOnboarding, error)
}
