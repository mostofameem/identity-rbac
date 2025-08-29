package token

import "identity-rbac/config"

type tokenService struct {
	JwtSecret                        string
	EmailInvitationTokenTTLInMinutes int
	AccessTokenTTLInMinutes          int
	RefreshTokenTTLInMinutes         int
}

func NewTokenService(cnf *config.Config) TokenService {
	return &tokenService{
		JwtSecret:                        cnf.JwtSecret,
		EmailInvitationTokenTTLInMinutes: cnf.EmailInvitationTTL,
		AccessTokenTTLInMinutes:          cnf.AccessTokenTTL,
		RefreshTokenTTLInMinutes:         cnf.RefreshTokenTTL,
	}
}


