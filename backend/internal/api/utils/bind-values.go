package utils

import (
	"log/slog"
	"net/http"
	"net/url"
	"strconv"

	"github.com/go-playground/form/v4"
)

// BindValues binds URL query parameters to a struct
func BindValues(v interface{}, values url.Values) error {
	dec := form.NewDecoder()
	return dec.Decode(v, values)
}

// GetIntPathParam extracts and validates an integer path parameter from the request
// Returns the parsed integer value or an error response if the parameter is missing or invalid
func GetIntPathParam(r *http.Request, paramName string, w http.ResponseWriter) (int, bool) {
	idStr := r.PathValue(paramName)

	if idStr == "" {
		slog.Error("missing parameter in path", "param", paramName)
		SendError(w, http.StatusBadRequest, "Missing '"+paramName+"' parameter in path")
		return 0, false
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Error("invalid parameter value", "param", paramName, "value", idStr, "error", err.Error())
		SendError(w, http.StatusBadRequest, "Invalid '"+paramName+"' parameter, must be an integer")
		return 0, false
	}

	return id, true
}
