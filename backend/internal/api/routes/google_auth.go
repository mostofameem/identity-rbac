package routes

import (
	"context"
	"net/http"

	"github.com/markbates/goth/gothic"
)

// There is no userTemplate needed here as we use handlers.

func (server *Server) initAuthRoutes(mux *http.ServeMux) {

	// Middleware to inject provider name into context for gothic
	withProvider := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			provider := r.PathValue("provider")
			if provider == "" {
				provider = "google" // Default to google
			}
			r = r.WithContext(context.WithValue(r.Context(), "provider", provider))
			next(w, r)
		}
	}

	mux.HandleFunc("GET /auth/{provider}", withProvider(server.handlers.GoogleLogin))
	mux.HandleFunc("GET /auth/{provider}/callback", withProvider(server.handlers.GoogleCallback))

	mux.HandleFunc("GET /logout/{provider}", func(w http.ResponseWriter, r *http.Request) {
		provider := r.PathValue("provider")
		r = r.WithContext(context.WithValue(r.Context(), "provider", provider))
		gothic.Logout(w, r)
		w.Header().Set("Location", "/")
		w.WriteHeader(http.StatusTemporaryRedirect)
	})
}
