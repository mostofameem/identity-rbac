package middlewares

import (
	"net/http"

	"github.com/rs/cors"
)

func EnableCors(mux *http.ServeMux) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.0.158:3000"},
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS", "PATCH", "PUT"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With", "Cookie"},
		AllowCredentials: true,
		Debug:            false,
	})
	return c.Handler(mux)
}
