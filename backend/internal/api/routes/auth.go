package routes

import (
	"net/http"

	"github.com/markbates/goth/gothic"
)

func (server *Server) initAuthRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/auth/{provider}/login", func(w http.ResponseWriter, r *http.Request) {
		gothic.BeginAuthHandler(w, r)
	})

	mux.HandleFunc(
		"/auth/{provider}/callback",
		http.HandlerFunc(server.handlers.AuthLogin),
	)
}
