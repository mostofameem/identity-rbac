package rbac

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type LoginWithSessionParams struct {
	Email     string
	Pass      string
	IpAddress *string
	UserAgent *string
}

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrInvalidPassword = errors.New("invalid password")
)

func (svc *service) Login(ctx context.Context, params LoginWithSessionParams) (string, string, error) {
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

	jti := uuid.New()

	accessToken, err := svc.tokenService.GenerateAccessToken(ctx, user.Id, jti.String())
	if err != nil {
		slog.ErrorContext(ctx, "Failed to generate jwt", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", err
	}

	refreshToken, err := svc.tokenService.GenerateRefreshToken(ctx, user.Id, jti.String())
	if err != nil {
		slog.ErrorContext(ctx, "Failed to generate jwt", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", "", err
	}

	now := time.Now()

	sessionReq := CreateUserSessionReq{
		UserId:    user.Id,
		Jti:       jti,
		IpAddress: params.IpAddress,
		UserAgent: params.UserAgent,
		ExpiresAt: now.Add(time.Duration(svc.cnf.AccessTokenTTL) * time.Minute),
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err = svc.userSessionRepo.Create(ctx, sessionReq)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to create user session", logger.Extra(map[string]any{
			"error":  err.Error(),
			"userId": user.Id,
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

func (s *service) GetUsers(ctx context.Context, email string) ([]Users, error) {
	users, err := s.userRepo.GetUsers(ctx, email)
	if err != nil {
		return nil, err
	}

	return users, nil
}

func (s *service) CreateUserWithMultipleRoles(ctx context.Context, req RegisterUserReq) error {
	user, err := s.userRepo.Get(ctx, req.Email)
	if err != nil {
		return err
	}

	if user != nil {
		return util.ErrAlreadyRegistered
	}

	userOnboarding, err := s.userOnboardingRepo.GetUserOnboarding(ctx, req.Email)
	if err != nil {
		return err
	}

	if userOnboarding == nil {
		slog.Info("User not invited", logger.Extra(map[string]any{
			"email": req.Email,
		}))

		return util.ErrNotFound
	}

	roles, err := s.roleRepo.Get(ctx, "")
	if err != nil {
		return err
	}

	roleMap := make(map[int]bool)
	for _, role := range roles {
		if role.IsActive {
			roleMap[role.Id] = true
		}
	}

	for _, roleId := range req.RoleIds {
		if !roleMap[roleId] {
			slog.Error("role is not active", logger.Extra(map[string]any{
				"roleId": roleId,
			}))

			return util.ErrRoleNotActive
		}
	}

	hashPass, err := util.HashPassword(req.Password)
	if err != nil {
		slog.Error("failed to hash password", logger.Extra(map[string]any{
			"error": err.Error(),
		}))

		return err
	}
	req.Password = hashPass

	var roleIds []int
	if err := json.Unmarshal([]byte(userOnboarding.RoleIds), &roleIds); err != nil {
		slog.Error("Failed to unmarshal role IDs", logger.Extra(map[string]any{
			"error":   err.Error(),
			"roleIds": userOnboarding.RoleIds,
		}))
		return err
	}

	req.RoleIds = roleIds
	req.CreatedBy = userOnboarding.CreatedBy

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
