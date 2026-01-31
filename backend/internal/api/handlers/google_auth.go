package handlers

import (
	"fmt"
	"identity-rbac/internal/api/utils"
	"log/slog"
	"net/http"

	"github.com/markbates/goth/gothic"
)

func (handlers *Handlers) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	slog.Info("Starting Google Login initiation")
	gothic.BeginAuthHandler(w, r)
}

func (handlers *Handlers) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	// Diagnostic: Log all request details
	slog.Info("Callback received",
		"url", r.URL.String(),
		"host", r.Host,
		"remote_addr", r.RemoteAddr,
	)

	// Log cookies to verify if session cookie is present
	cookies := r.Cookies()
	slog.Info("Total cookies received", "count", len(cookies))
	for _, c := range cookies {
		slog.Info("Cookie found", "name", c.Name)
	}

	user, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		slog.Error("Google Auth Callback failed", "error", err.Error())
		http.Error(w, fmt.Sprintf("Authentication failed: %v", err), http.StatusInternalServerError)
		return
	}

	accessToken, refreshToken, err := handlers.rbacSvc.AuthLogin(r.Context(), user.Email)
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "Failed to get user")
		return
	}

	if accessToken == "" || refreshToken == "" {
		utils.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	utils.SendData(w, map[string]any{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}
