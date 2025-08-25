package utils

import (
	"net/http"
)

func SendData(w http.ResponseWriter, data interface{}) {
	SendJson(w, http.StatusOK, data)
}
