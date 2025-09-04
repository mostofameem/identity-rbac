package routes

import (
	"identity-rbac/internal/api/middlewares"
	"net/http"
)

func (server *Server) initUserRoutes(mux *http.ServeMux, manager *middlewares.Manager) {
	mux.Handle(
		"POST /api/v1/register",
		manager.With(
			http.HandlerFunc(server.handlers.Register),
			server.middleware.AuthenticateEmailInvitationToken,
		),
	)

	mux.Handle(
		"POST /api/v1/login",
		manager.With(
			http.HandlerFunc(server.handlers.Login),
		),
	)

	mux.Handle(
		"POST /api/v1/roles",
		manager.With(
			http.HandlerFunc(server.handlers.AddRole),
			server.middleware.Authorization(middlewares.ROLE_CREATE_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/roles",
		manager.With(
			http.HandlerFunc(server.handlers.GetRoles),
			server.middleware.Authorization(middlewares.ROLE_ASSIGN_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/permissions",
		manager.With(
			http.HandlerFunc(server.handlers.GetPermissions),
			server.middleware.Authorization(middlewares.ROLE_ASSIGN_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"POST /api/v1/users/assign-role",
		manager.With(
			http.HandlerFunc(server.handlers.AddRoleToUser),
			server.middleware.Authorization(middlewares.ROLE_ASSIGN_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"POST /api/v1/roles/assign-permission",
		manager.With(
			http.HandlerFunc(server.handlers.AddPermissionToRole),
			server.middleware.Authorization(middlewares.PERMISSION_ASSIGN_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"POST /api/v1/users/invite",
		manager.With(
			http.HandlerFunc(server.handlers.InviteUser),
			server.middleware.Authorization(middlewares.USER_CREATE_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/users/me/permissions",
		manager.With(
			http.HandlerFunc(server.handlers.GetUserPermissions),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/v1/token/refresh",
		manager.With(
			http.HandlerFunc(server.handlers.GetAccessToken),
		),
	)

	mux.Handle(
		"GET /api/v1/users",
		manager.With(
			http.HandlerFunc(server.handlers.GetUsers),
			server.middleware.Authorization(middlewares.USER_VIEW_ACCESS),
			server.middleware.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PATCH /api/v1/reset-password",
		manager.With(
			http.HandlerFunc(server.handlers.ResetPassword),
			server.middleware.AuthenticateJWT,
		),
	)
}
