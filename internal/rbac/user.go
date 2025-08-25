package rbac

import (
	"context"
	"errors"
	"fmt"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type CreateUserReq struct {
	Email     string
	Pass      string
	RoleId    int
	IsActive  bool
	CreatedBy int
	CreatedAt time.Time
}

type LoginParams struct {
	Email string
	Pass  string
}

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrInvalidPassword = errors.New("invalid password")
)

func (s *service) CreateUser(ctx context.Context, req CreateUserReq) error {
	hashPass, err := util.HashPassword(req.Pass)
	if err != nil {
		slog.Error("failed to hash password", logger.Extra(map[string]any{
			"error": err.Error(),
		}))

		return err
	}
	req.Pass = hashPass

	_, err = s.userRepo.Create(ctx, req)
	if err != nil {
		return err
	}

	return nil
}

func (svc *service) Login(ctx context.Context, params LoginParams) (string, string, error) {
	user, err := svc.userRepo.Get(ctx, params.Email)
	if err != nil {
		return "", "", err
	}

	if user == nil {
		return "", "", ErrUserNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Pass), []byte(params.Pass)); err != nil {
		slog.ErrorContext(ctx, "Invalid password", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", ErrInvalidPassword
	}

	accessToken, err := svc.genAccessToken(user.Id, user.Email)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to generate jwt", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", err
	}

	refreshToken, err := svc.genRefreshToken(user.Id, user.Email)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to generate jwt", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (svc *service) AuthLogin(ctx context.Context, email string) (string, string, error) {
	user, err := svc.userRepo.Get(ctx, email)
	if err != nil {
		return "", "", err
	}

	if user == nil {
		return "", "", fmt.Errorf("user with email %s not found", email)
	}

	accessToken, err := svc.genAccessToken(user.Id, user.Email)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to generate jwt", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", err
	}

	refreshToken, err := svc.genRefreshToken(user.Id, user.Email)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to generate jwt", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (s *service) GetUserPermission(ctx context.Context, userId int) ([]string, error) {
	permissions, err := s.userRepo.GetUserPermission(ctx, userId)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to get user permissions", logger.Extra(map[string]any{
			"error":  err.Error(),
			"userId": userId,
		}))
		return nil, err
	}

	return permissions, nil
}

func (svc *service) LoginV2(ctx context.Context, params LoginParams) (string, string, []string, error) {
	user, err := svc.userRepo.Get(ctx, params.Email)
	if err != nil {
		return "", "", []string{}, err
	}

	if user == nil {
		return "", "", []string{}, ErrUserNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Pass), []byte(params.Pass)); err != nil {
		slog.ErrorContext(ctx, "Invalid password", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", []string{}, ErrInvalidPassword
	}

	accessToken, err := svc.genAccessToken(user.Id, user.Email)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to generate jwt", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", []string{}, err
	}

	refreshToken, err := svc.genRefreshToken(user.Id, user.Email)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to generate jwt", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", []string{}, err
	}

	permissions, err := svc.userRepo.GetUserPermission(ctx, user.Id)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to get user permissions", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", []string{}, err
	}
	return accessToken, refreshToken, permissions, nil
}

func (s *service) GetUsers(ctx context.Context, email string) ([]Users, error) {
	roles, err := s.userRepo.GetUsers(ctx, email)
	if err != nil {
		return nil, err
	}

	return roles, nil
}

func (s *service) CreateUserV2(ctx context.Context, req CreateUserReq) error {
	user, err := s.userRepo.Get(ctx, req.Email)
	if err != nil {
		return err
	}

	if user != nil {
		return util.ErrAlreadyRegistered
	}

	role, err := s.roleRepo.GetOne(ctx, req.RoleId)
	if err != nil {
		return err
	}

	if role == nil {
		return util.ErrNotFound
	}

	hashPass, err := util.HashPassword(req.Pass)
	if err != nil {
		slog.Error("failed to hash password", logger.Extra(map[string]any{
			"error": err.Error(),
		}))

		return err
	}
	req.Pass = hashPass

	err = s.userRepo.CreateUserWithRoleTx(ctx, req)
	if err != nil {
		return err
	}

	return nil
}

func (s *service) CreateUserV2WithMultipleRoles(ctx context.Context, req CreateUserV2Req) error {
	user, err := s.userRepo.Get(ctx, req.Email)
	if err != nil {
		return err
	}

	if user != nil {
		return util.ErrAlreadyRegistered
	}

	// Validate that all roles exist
	for _, roleId := range req.RoleIds {
		role, err := s.roleRepo.GetOne(ctx, roleId)
		if err != nil {
			return err
		}

		if role == nil {
			return util.ErrNotFound
		}
	}

	hashPass, err := util.HashPassword(req.Pass)
	if err != nil {
		slog.Error("failed to hash password", logger.Extra(map[string]any{
			"error": err.Error(),
		}))

		return err
	}
	req.Pass = hashPass

	err = s.userRepo.CreateUserWithMultipleRolesTx(ctx, req)
	if err != nil {
		return err
	}

	return nil
}

func (s *service) ResetPassword(ctx context.Context, req ResetPasswordReq) error {
	user, err := s.userRepo.GetOne(ctx, req.UserID)
	if err != nil {
		return err
	}

	if user == nil {
		return util.ErrNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Pass), []byte(req.OldPassword)); err != nil {
		slog.Error("Invalid old password", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return util.ErrPasswordMismatch
	}

	newHashPass, err := util.HashPassword(req.NewPassword)
	if err != nil {
		slog.Error("failed to hash new password", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	err = s.userRepo.UpdatePassword(ctx, req.UserID, newHashPass)
	if err != nil {
		slog.Error("Failed to update password", logger.Extra(map[string]any{
			"error": err.Error(),
			"user":  req.UserID,
		}))
		return err
	}

	return nil
}
