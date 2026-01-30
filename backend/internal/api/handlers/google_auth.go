package handlers

import (
	"identity-rbac/internal/api/utils"
	"net/http"

	"github.com/markbates/goth/gothic"
)

func (handlers *Handlers) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	gothic.BeginAuthHandler(w, r)
	return
}

func (handlers *Handlers) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	user, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
