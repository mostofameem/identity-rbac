package routes

import (
	"fmt"
	"identity-rbac/config"
	"identity-rbac/internal/api/handlers"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/swagger"
	"log/slog"
	"net/http"
	"sync"
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

func (server *Server) Start() {
	manager := middlewares.NewManager()

	mux := http.NewServeMux()

	swagger.SetupSwagger(mux, manager)
	server.initRoutes(mux, manager)

	handler := middlewares.EnableCors(mux)

	server.Wg.Add(1)

	go func() {
		defer server.Wg.Done()

		addr := fmt.Sprintf(":%d", server.cnf.HttpPort)

		slog.Info(fmt.Sprintf("Listening at %s", addr))

		if err := http.ListenAndServe(addr, handler); err != nil {
			slog.Error(err.Error())
		}
	}()

}
