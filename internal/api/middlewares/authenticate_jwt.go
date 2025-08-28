package middlewares

import (
	"context"
	token "identity-rbac/internal/Token"
	"identity-rbac/internal/api/utils"
	"log"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UidKey       contextKey = "id"
	UserEmailKey contextKey = "email"
	RoleIdsKey   contextKey = "roleIds"
)

const (
	emailInvitationTokenType = "email_invitation"
	accessTokenTokenType     = "access"
	refreshTokenTokenType    = "refresh"
)

func unauthorizedResponse(w http.ResponseWriter, msg string) {
	log.Println("Unauthorized access:", msg)
	utils.SendError(w, http.StatusUnauthorized, "Unauthorized: "+msg)
}

func (m *Middleware) AuthenticateJWT(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		var tokenStr string
		if header != "" {
			tokens := strings.Split(header, " ")
			if len(tokens) != 2 || tokens[0] != "Bearer" {
				unauthorizedResponse(w, "Invalid Authorization format")
				return
			}
			tokenStr = tokens[1]
		} else {
			tokenStr = r.URL.Query().Get("auth")
		}
		if tokenStr == "" {
			unauthorizedResponse(w, "Missing token")
			return
		}
		var claims token.TokenDto
		token, err := jwt.ParseWithClaims(tokenStr, &claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(m.cnf.JwtSecret), nil
		})
		if err != nil {
			unauthorizedResponse(w, "Invalid token: "+err.Error())
			return
		}
		if !token.Valid {
			unauthorizedResponse(w, "Token is not valid")
			return
		}
		if claims.ExpiresAt.Time.Before(time.Now()) {
			unauthorizedResponse(w, "Token has expired")
			return
		}

		if claims.TokenType != accessTokenTokenType {
			slog.Error("Invalid token type",
				slog.String("tokenType", claims.TokenType),
				slog.String("requiredTokenType", accessTokenTokenType),
			)

			unauthorizedResponse(w, "Invalid token type")
			return
		}

		ctx := context.WithValue(r.Context(), UidKey, claims.Id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (m *Middleware) AuthenticateEmailInvitationToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		var tokenStr string
		if header != "" {
			tokens := strings.Split(header, " ")
			if len(tokens) != 2 || tokens[0] != "Bearer" {
				unauthorizedResponse(w, "Invalid Authorization format")
				return
			}
			tokenStr = tokens[1]
		} else {
			tokenStr = r.URL.Query().Get("auth")
		}
		if tokenStr == "" {
			slog.Error("Missing token")
			unauthorizedResponse(w, "Missing token")
			return
		}
		var claims token.EmailInvitationDto
		token, err := jwt.ParseWithClaims(tokenStr, &claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(m.cnf.JwtSecret), nil
		})
		if err != nil {
			unauthorizedResponse(w, "Invalid token: "+err.Error())
			return
		}
		if !token.Valid {
			unauthorizedResponse(w, "Token is not valid")
			return
		}
		if claims.ExpiresAt.Time.Before(time.Now()) {
			unauthorizedResponse(w, "Token has expired")
			return
		}

		if claims.TokenType != emailInvitationTokenType {
			slog.Error("Invalid token type",
				slog.String("tokenType", claims.TokenType),
				slog.String("requiredTokenType", emailInvitationTokenType),
			)

			unauthorizedResponse(w, "Invalid token type")
			return
		}

		ctx := context.WithValue(r.Context(), UserEmailKey, claims.Email)
		ctx = context.WithValue(ctx, RoleIdsKey, claims.RoleIds)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
