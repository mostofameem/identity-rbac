package handlers

import (
	"identity-rbac/internal/api/utils"
	"net/http"
)

func (handlers *Handlers) Hello(w http.ResponseWriter, r *http.Request) {
	utils.SendJson(w, http.StatusOK, map[string]any{
		"success": true,
	})
}
