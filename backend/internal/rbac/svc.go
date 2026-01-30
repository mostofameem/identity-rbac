package rbac

import (
	"identity-rbac/config"
	mail "identity-rbac/internal/Mail"
	"identity-rbac/internal/redis"
	"identity-rbac/internal/token"
)

type service struct {
	cnf                   *config.Config
	userRepo              UserRepo
	roleRepo              RoleRepo
	permissionRepo        PermissionRepo
	userHasRoleRepo       UserHasRoleRepo
	roleHasPermissionRepo RoleHasPermissionRepo
	userOnboardingRepo    UserOnboardingRepo
	userSessionRepo       UserSessionRepo
	tokenService          token.TokenService
	mailService           mail.MailService
	cacheService          redis.CacheService
}

func NewService(
	cnf *config.Config,
	userRepo UserRepo,
	roleRepo RoleRepo,
	permissionRepo PermissionRepo,
	userHasRoleRepo UserHasRoleRepo,
	roleHasPermissionRepo RoleHasPermissionRepo,
	userOnboardingRepo UserOnboardingRepo,
	userSessionRepo UserSessionRepo,
	tokenService token.TokenService,
	mailService mail.MailService,
	cacheService redis.CacheService,
) Service {
	return &service{
		cnf:                   cnf,
		userRepo:              userRepo,
		roleRepo:              roleRepo,
		permissionRepo:        permissionRepo,
		userHasRoleRepo:       userHasRoleRepo,
		roleHasPermissionRepo: roleHasPermissionRepo,
		userOnboardingRepo:    userOnboardingRepo,
		userSessionRepo:       userSessionRepo,
		tokenService:          tokenService,
		mailService:           mailService,
		cacheService:          cacheService,
	}
}
