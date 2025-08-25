package utils

import "net/http"

func SendError(w http.ResponseWriter, statusCode int, message string) {
	SendJson(w, statusCode, map[string]any{
		"status":  http.StatusText(statusCode),
		"message": message,
	})
}
