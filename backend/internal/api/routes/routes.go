package routes

import (
	"identity-rbac/internal/api/middlewares"
	"net/http"
)

func (server *Server) initRoutes(mux *http.ServeMux, manager *middlewares.Manager) {
	mux.Handle(
		"GET /health-check",
		manager.With(
			http.HandlerFunc(server.handlers.Hello),
		),
	)

	server.initAuthRoutes(mux)
	server.initUserRoutes(mux, manager)
}
