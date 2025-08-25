package rbac

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AuthClaims struct {
	Id    int    `json:"id"`
	Email string `json:"email"`
	jwt.RegisteredClaims
}

func (s *service) genAccessToken(id int, email string) (string, error) {
	claims := &AuthClaims{
		Id:    id,
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(s.cnf.TokenExpireTimeInHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.cnf.JwtSecret))
	if err != nil {
		return "", fmt.Errorf("failed to generate jwt: %w", err)
	}

	return token, nil
}

func (s *service) genRefreshToken(id int, email string) (string, error) {
	claims := &AuthClaims{
		Id:    id,
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(10000 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.cnf.JwtSecret))
	if err != nil {
		return "", fmt.Errorf("failed to generate jwt: %w", err)
	}

	return token, nil
}

func (s *service) GetAccessTokenFromRefreshToken(ctx context.Context, refreshToken string) (string, error) {
	var claims AuthClaims
	jwtToken, err := jwt.ParseWithClaims(refreshToken, &claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(s.cnf.JwtSecret), nil
	})
	if err != nil {
		return "", err
	}
	if !jwtToken.Valid {
		return "", err
	}
	if claims.ExpiresAt.Time.Before(time.Now()) {
		return "", err
	}

	newClaims := &AuthClaims{
		Id:    claims.Id,
		Email: claims.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(s.cnf.TokenExpireTimeInHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims).SignedString([]byte(s.cnf.JwtSecret))
	if err != nil {
		return "", fmt.Errorf("failed to generate jwt: %w", err)
	}

	return accessToken, nil
}
