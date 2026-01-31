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

	mux.Handle(
		"GET /api/v1/events",
		manager.With(
			http.HandlerFunc(server.handlers.GetEvents),
			server.middleware.Authorization(middlewares.EVENT_VIEW_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/public/events",
		manager.With(
			http.HandlerFunc(server.handlers.GetPublicEvents),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/v1/events/{id}/change-status",
		manager.With(
			http.HandlerFunc(server.handlers.UpdateEventStatus),
			server.middleware.Authorization(middlewares.EVENT_UPDATE_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/events/{id}",
		manager.With(
			http.HandlerFunc(server.handlers.GetEventDetails),
			server.middleware.Authorization(middlewares.EVENT_VIEW_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"POST /api/v1/event-types",
		manager.With(
			http.HandlerFunc(server.handlers.CreateEventType),
			server.middleware.Authorization(middlewares.EVENT_TYPE_CREATE_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/event-types",
		manager.With(
			http.HandlerFunc(server.handlers.GetEventTypes),
			server.middleware.Authorization(middlewares.EVENT_TYPE_VIEW_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/event-types/{id}",
		manager.With(
			http.HandlerFunc(server.handlers.GetEventTypeDetails),
			server.middleware.Authorization(middlewares.EVENT_TYPE_VIEW_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/v1/event-type/{id}/change-status",
		manager.With(
			http.HandlerFunc(server.handlers.UpdateEventTypeStatus),
			server.middleware.Authorization(middlewares.EVENT_TYPE_UPDATE_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/v1/event-types/settings",
		manager.With(
			http.HandlerFunc(server.handlers.CreateEventTypeSettings),
			server.middleware.Authorization(middlewares.EVENT_CREATE_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/event-types/settings/{id}",
		manager.With(
			http.HandlerFunc(server.handlers.GetEventTypeSettings),
			server.middleware.Authorization(middlewares.EVENT_CREATE_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"POST /api/v1/event/participate",
		manager.With(
			http.HandlerFunc(server.handlers.PerticipateEvent),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/event/participations",
		manager.With(
			http.HandlerFunc(server.handlers.GetMyEventPerticipations),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/v1/event/participations/update-status",
		manager.With(
			http.HandlerFunc(server.handlers.UpdatePerticipationStatus),
			server.middleware.AuthenticateJWT,
		),
	)
}
