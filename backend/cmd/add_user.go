package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"identity-rbac/config"
	mail "identity-rbac/internal/Mail"
	"identity-rbac/internal/rbac"
	repo "identity-rbac/internal/repo"
	"identity-rbac/internal/token"
	"identity-rbac/pkg/logger"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/spf13/cobra"
)

var serveAddUserCmd = &cobra.Command{
	Use:   "serve-add-user",
	Short: "Initialize the user, role, permission, and module",
	RunE:  serveAddUser,
}

type User struct {
	Email    string `json:"userEmail"`
	FullName string `json:"fullName"`
}

func serveAddUser(cmd *cobra.Command, args []string) error {
	cnf := config.GetConfig()

	userInfo, err := loadUserFromConfig("./user_config.json")
	if err != nil {
		return fmt.Errorf("failed to load user config: %w", err)
	}

	db, err := repo.NewDB(cnf.DB)
	if err != nil {
		slog.Error("Failed to connect to database:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer repo.CloseDB(db)

	mailService := mail.NewMailService(cnf.Mail)
	tokenService := token.NewTokenService(cnf)
	roleRepo := repo.NewRoleRepo(db)
	userOnboardingProcessRepo := repo.NewUserOnboardingRepo(db)

	superAdminRole, err := roleRepo.Get(context.Background(), "Super Admin")
	if err != nil {
		slog.Error("Failed to get super admin role:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	if superAdminRole == nil {
		slog.Error("Super admin role not found:", logger.Extra(map[string]any{
			"error": "super admin role not found",
		}))
		return fmt.Errorf("super admin role not found")
	}

	// Send the invitation asynchronously (overlaps with the onboarding insert)
	// goroutine would be killed mid-send.
	var emailWg sync.WaitGroup
	emailWg.Add(1)
	defer emailWg.Wait()
	go func() {
		defer emailWg.Done()
		sendInvitationEmail(cnf, mailService, tokenService, userInfo.Email, userInfo.FullName, superAdminRole[0].Id)
	}()

	err = userOnboardingProcessRepo.Create(context.Background(), &rbac.UserOnboardingProcess{
		Email:     userInfo.Email,
		RoleIds:   []int{superAdminRole[0].Id},
		Status:    "PENDING",
		Completed: false,
		ExpiredAt: time.Now().Add(7 * 24 * time.Hour),
		CreatedBy: 1,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	})
	if err != nil {
		slog.Error("Failed to create user onboarding process:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	return nil
}

// sendInvitationEmail generates the invitation token and emails it. It is
// is unavailable.
func sendInvitationEmail(
	cnf *config.Config,
	mailService mail.MailService,
	tokenService token.TokenService,
	userEmail, userFullName string,
	roleId int,
) {
	emailInvitationToken, err := tokenService.GenerateEmailInvitationToken(context.Background(), userEmail, []int{roleId})
	if err != nil {
		slog.Error("Failed to generate email invitation token:", logger.Extra(map[string]any{
			"error": err.Error(),
			"email": userEmail,
		}))
		return
	}

	invitationURL := fmt.Sprintf("%s=%s", cnf.Mail.FrontendURL, emailInvitationToken)

	slog.Info("Invitation link generated.", logger.Extra(map[string]any{
		"email":          userEmail,
		"invitation_url": invitationURL,
		"expires_at":     time.Now().Add(7 * 24 * time.Hour).Format(time.RFC3339),
	}))

	templateData := map[string]interface{}{
		"UserName":      userFullName,
		"UserEmail":     userEmail,
		"CompanyName":   "Identity RBAC",
		"InvitationURL": invitationURL,
		"ExpiresAt":     time.Now().Add(7 * 24 * time.Hour).Format("January 2, 2006"),
		"SupportEmail":  "support@your-company.com",
	}

	if err := mailService.SendTemplateEmail(userEmail, "email_invitation", templateData); err != nil {
		slog.Error("Failed to send email invitation:", logger.Extra(map[string]any{
			"error": err.Error(),
			"email": userEmail,
		}))
		return
	}

	slog.Info("Email invitation sent successfully.", logger.Extra(map[string]any{
		"email": userEmail,
	}))
}

func loadUserFromConfig(configPath string) (*User, error) {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var user User
	if err := json.Unmarshal(data, &user); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	if user.Email == "" {
		slog.Error("userEmail is required in config file")
		return nil, fmt.Errorf("userEmail is required in config file")
	}
	if user.FullName == "" {
		slog.Error("fullName is required in config file")
		return nil, fmt.Errorf("fullName is required in config file")
	}

	return &user, nil
}
