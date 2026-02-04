package cmd

import (
	"context"
	"identity-rbac/config"
	mail "identity-rbac/internal/Mail"
	"identity-rbac/internal/api/handlers"
	"identity-rbac/internal/api/middlewares"
	web "identity-rbac/internal/api/routes"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/auth"
	"identity-rbac/internal/event"
	"identity-rbac/internal/rbac"
	"identity-rbac/internal/redis"
	repo "identity-rbac/internal/repo"
	"identity-rbac/internal/token"
	"identity-rbac/internal/worker"
	"identity-rbac/pkg/logger"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

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

	db, err := repo.NewDB(cnf.DB)
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
	userOnboardingRepo := repo.NewUserOnboardingRepo(db)
	tokenService := token.NewTokenService(cnf)
	userSessionRepo := repo.NewUserSessionRepo(db)
	mailService := mail.NewMailService(cnf.Mail)

	redisClient, err := redis.NewClient(cnf.Redis)
	if err != nil {
		slog.Error("Failed to Connect with Redis:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer redisClient.Close()
	cacheService := redis.NewCacheService(redisClient)

	rbacSvc := rbac.NewService(cnf,
		userRepo,
		roleRepo,
		permissionRepo,
		userHasRoleRepo,
		roleHasPermissionRepo,
		userOnboardingRepo,
		userSessionRepo,
		tokenService,
		mailService,
		cacheService,
	)

	eventRepo := repo.NewEventRepo(db)
	eventTypeRepo := repo.NewEventTypeRepo(db)
	eventTypeSettingRepo := repo.NewEventTypeSettingRepo(db)
	participantRepo := repo.NewParticipantRepo(db)
	eventSettingRepo := repo.NewEventTypeSettingRepo(db)
	transaction := repo.NewTransaction(db)
	hotEventsRepo := repo.NewHotEventsRepo(db)

	eventSvc := event.NewEventSerVice(
		cnf,
		eventRepo,
		eventTypeRepo,
		eventTypeSettingRepo,
		participantRepo,
		eventSettingRepo,
		transaction,
		hotEventsRepo,
	)

	rateLimiterSvc := redis.NewTokenBucketRateLimiterService(redisClient, cnf.RateLimit)

	handlers := handlers.NewHandlers(cnf, rbacSvc, eventSvc, rateLimiterSvc)

	middleware := middlewares.NewMiddleware(cnf, userRepo, roleRepo, permissionRepo, roleHasPermissionRepo, userHasRoleRepo)

	server := web.NewServer(cnf, handlers, middleware)

	workerTransaction := repo.NewTransaction(db)
	autoEventCreateWorker := worker.NewAutoEventCreateWorker(
		cnf,
		eventRepo,
		eventSettingRepo,
		workerTransaction,
		hotEventsRepo,
		cacheService,
	)

	// Create main context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Create a derived context for the worker that can be cancelled independently
	workerCtx, cancelWorker := context.WithCancel(ctx)
	defer cancelWorker()

	server.Wg.Add(1)
	go func() {
		defer server.Wg.Done()
		autoEventCreateWorker.Run(workerCtx)
	}()

	// Start the server, and if it exits for any reason, cancel the worker context
	server.Start(ctx, func() {
		slog.Warn("Server exited, cancelling background workers...")
		cancelWorker()
	})

	// Wait for interruption signal or all goroutines to finish
	server.Wg.Wait()

	return nil
}
