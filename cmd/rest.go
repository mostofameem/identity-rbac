package cmd

import (
	"identity-rbac/config"
	"identity-rbac/internal/api/handlers"
	"identity-rbac/internal/api/middlewares"
	web "identity-rbac/internal/api/routes"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/auth"
	"identity-rbac/internal/rbac"
	repo "identity-rbac/internal/repo"
	"identity-rbac/pkg/logger"
	"log/slog"

	"github.com/spf13/cobra"
)

var serveRestCmd = &cobra.Command{
	Use:   "serve-rest",
	Short: "start a rest server",
	RunE:  serveRest,
}

func serveRest(cmd *cobra.Command, args []string) error {
	cnf := config.GetConfig()

	utils.InitValidator()
	auth.InitAuthSetting(cnf.Auth)

	logger.SetupLogger(cnf.ServiceName)

	db, err := repo.NewMysqlDB(cnf.DB)
	if err != nil {
		slog.Error("Failed to Connect with Database:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer repo.CloseDB(db)

	userRepo := repo.NewUserRepo(db)
	roleRepo := repo.NewRoleRepo(db)
	permissionRepo := repo.NewPermissionRepo(db)
	userHasRoleRepo := repo.NewUserHasRoleRepo(db)
	roleHasPermissionRepo := repo.NewRoleHasPermissionRepo(db)

	rbacSvc := rbac.NewService(cnf, userRepo, roleRepo, permissionRepo, userHasRoleRepo, roleHasPermissionRepo)

	handlers := handlers.NewHandlers(cnf, rbacSvc)

	middleware := middlewares.NewMiddleware(cnf, userRepo, roleRepo, permissionRepo, roleHasPermissionRepo, userHasRoleRepo)
	server := web.NewServer(cnf, handlers, middleware)
	server.Run()
	server.Wg.Wait()

	return nil
}
