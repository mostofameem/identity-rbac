package middlewares

import (
	"net/http"

	"github.com/rs/cors"
)

func EnableCors(mux *http.ServeMux) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS", "PATCH", "PUT"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With", "Cookie"},
		AllowCredentials: true,
		Debug:            false,
	})
	return c.Handler(mux)
}
