package rbac

import (
	"context"
	"fmt"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"
)

func (s *service) InviteUser(ctx context.Context, req InviteUserReq) error {
	user, err := s.userRepo.Get(ctx, req.Email)
	if err != nil {
		return err
	}

	if user != nil {
		return util.ErrAlreadyRegistered
	}

	isInvited, err := s.userOnboardingRepo.GetUserOnboarding(ctx, req.Email)
	if err != nil {
		return err
	}

	if isInvited != nil {
		if isInvited.ExpiredAt.After(req.CreatedAt) {
			return util.ErrAlreadyInvited
		}
	}

	err = s.userOnboardingRepo.Create(ctx, &UserOnboardingProcess{
		Email:     req.Email,
		RoleIds:   req.RoleIds,
		Status:    "invited",
		Completed: false,
		CreatedAt: req.CreatedAt,
		ExpiredAt: req.CreatedAt.Add(time.Hour * time.Duration(s.cnf.EmailInvitationTTL)),
	})
	if err != nil {
		return err
	}

	emailInvitationToken, err := s.tokenService.GenerateEmailInvitationToken(context.Background(), req.Email, req.RoleIds)
	if err != nil {
		slog.Error("Failed to generate email invitation token:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	templateData := map[string]interface{}{
		"UserName":      req.UserName,
		"UserEmail":     req.Email,
		"CompanyName":   "Identity RBAC",
		"InvitationURL": fmt.Sprintf("%s=%s", s.cnf.Mail.FrontendURL, emailInvitationToken),
		"ExpiresAt":     time.Now().Add(7 * 24 * time.Hour).Format("January 2, 2006"),
		"SupportEmail":  "support@your-company.com",
	}

	err = s.mailService.SendTemplateEmail(req.Email, "email_invitation", templateData)
	if err != nil {
		slog.Error("Failed to send email invitation:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	return nil
}
