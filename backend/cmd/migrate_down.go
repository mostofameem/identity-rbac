package cmd

import (
	"identity-rbac/config"
	"identity-rbac/internal/api/utils"
	repo "identity-rbac/internal/repo"
	"identity-rbac/pkg/logger"
	"log/slog"

	"github.com/spf13/cobra"
)

var migrateDownCmd = &cobra.Command{
	Use:   "serve-migrate-down",
	Short: "migrate down database tables",
	RunE:  migrateDownDB,
}

func migrateDownDB(cmd *cobra.Command, args []string) error {
	cnf := config.GetConfig()

	utils.InitValidator()

	logger.SetupLogger(cnf.ServiceName)

	db, err := repo.NewDB(cnf.DB)
	if err != nil {
		slog.Error("Failed to Connect with Database:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer repo.CloseDB(db)

	err = repo.MigrateDownDB(db.Db, cnf.MigrationSource)
	if err != nil {
		slog.Error("Failed to Migrate Down Database:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	slog.Info("Database migration down completed successfully")
	return nil
}
