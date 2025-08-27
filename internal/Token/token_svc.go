package token

import (
	"context"
	"fmt"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	emailInvitationTokenType = "email_invitation"
	accessTokenTokenType     = "access"
	refreshTokenTokenType    = "refresh"
)

func (s *tokenService) GenerateEmailInvitationToken(ctx context.Context, email string, roleIds []int) (string, error) {
	claims := &EmailInvitationDto{
		Email:     email,
		RoleIds:   roleIds,
		TokenType: emailInvitationTokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(s.EmailInvitationTokenTTLInMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.JwtSecret))
	if err != nil {
		slog.ErrorContext(ctx, "failed to generate email invitation token", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", fmt.Errorf("failed to generate email invitation token")
	}

	return token, nil
}

func (s *tokenService) GenerateAccessToken(ctx context.Context, id int, jti string) (string, error) {
	claims := &TokenDto{
		Id:        id,
		Jti:       jti,
		TokenType: accessTokenTokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(s.AccessTokenTTLInMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.JwtSecret))
	if err != nil {
		slog.ErrorContext(ctx, "failed to generate access token", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", fmt.Errorf("failed to generate access token")
	}

	return token, nil
}

func (s *tokenService) GenerateRefreshToken(ctx context.Context, id int, jti string) (string, error) {
	claims := &TokenDto{
		Id:        id,
		Jti:       jti,
		TokenType: refreshTokenTokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(s.RefreshTokenTTLInMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.JwtSecret))
	if err != nil {
		slog.ErrorContext(ctx, "failed to generate refresh token", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return "", fmt.Errorf("failed to generate refresh token")
	}

	return token, nil
}
