package token

import "github.com/golang-jwt/jwt/v5"

type EmailInvitationDto struct {
	Email   string `json:"email"`
	RoleIds []int  `json:"role_ids"`
	jwt.RegisteredClaims
}

type TokenDto struct {
	Id  int    `json:"id"`
	Jti string `json:"jti"`
	jwt.RegisteredClaims
}
