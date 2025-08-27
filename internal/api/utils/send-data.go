package utils

import (
	"net/http"
)

func SendData(w http.ResponseWriter, data interface{}) {
	SendJson(w, http.StatusOK, data)
}

func SendDataWithStatus(w http.ResponseWriter, data interface{}, status int) {
	SendJson(w, status, data)
}
