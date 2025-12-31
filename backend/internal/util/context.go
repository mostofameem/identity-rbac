package util

import (
	"identity-rbac/internal/api/middlewares"
	"net/http"
)

func GetRequestedUserID(r *http.Request) *int {
	createdBy, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		return nil
	}

	return &createdBy
}
