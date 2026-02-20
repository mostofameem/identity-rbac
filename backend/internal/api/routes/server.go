package routes

import (
	"context"
	"fmt"
	"identity-rbac/config"
	"identity-rbac/internal/api/handlers"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/swagger"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

type Server struct {
	handlers   *handlers.Handlers
	cnf        *config.Config
	Wg         sync.WaitGroup
	middleware *middlewares.Middleware
}

func NewServer(cnf *config.Config, handlers *handlers.Handlers, middleware *middlewares.Middleware) *Server {
	return &Server{
		cnf:        cnf,
		handlers:   handlers,
		middleware: middleware,
	}
}

func (server *Server) Start(ctx context.Context, onServerExit func()) {
	manager := middlewares.NewManager()

	mux := http.NewServeMux()

	swagger.SetupSwagger(mux, manager)
	server.initRoutes(mux, manager)

	handler := middlewares.EnableCors(mux)

	addr := fmt.Sprintf(":%d", server.cnf.HttpPort)
	srv := &http.Server{
		Addr:    addr,
		Handler: handler,
	}

	server.Wg.Add(1)
	go func() {
		defer server.Wg.Done()
		defer onServerExit() // Trigger callback when server exits

		slog.Info(fmt.Sprintf("Listening at %s", addr))

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error(err.Error())
		}
	}()

	server.Wg.Add(1)
	go func() {
		defer server.Wg.Done()
		<-ctx.Done()
		slog.Info("Shutting down server...")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			slog.Error(fmt.Sprintf("Server forced to shutdown: %v", err))
		}
		slog.Info("Server exited")
	}()
}
