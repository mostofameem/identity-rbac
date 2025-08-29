package middlewares

import (
	"log/slog"
	"net/http"
)

func (m *Middleware) Authorization(requiredPermissions ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userId, ok := r.Context().Value(UidKey).(int)
			if !ok {
				slog.Error("user id not found")
				unauthorizedResponse(w, "You are not authorized")
				return
			}

			userPermissions, err := m.userRepo.GetUserPermission(r.Context(), userId)
			if err != nil {
				unauthorizedResponse(w, "You are not authorized")
				return
			}
			if checkPermissions(userPermissions, requiredPermissions) {
				next.ServeHTTP(w, r)
				return
			}
			unauthorizedResponse(w, "You are not authorized")
		})
	}
}

func checkPermissions(userPermissions []string, requiredPermissions []string) bool {
	for _, userPermission := range userPermissions {
		for _, requiredPermission := range requiredPermissions {
			if userPermission == requiredPermission {
				return true
			}
		}
	}
	return false
}
