package routes

import (
	"identity-rbac/internal/api/middlewares"
	"net/http"
)

func (server *Server) initEventRoutes(mux *http.ServeMux, manager *middlewares.Manager) {
	mux.Handle(
		"POST /api/v1/events",
		manager.With(
			http.HandlerFunc(server.handlers.CreateEvent),
			server.middleware.Authorization(middlewares.EVENT_CREATE_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)
}
