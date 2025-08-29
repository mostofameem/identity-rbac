package token

import "context"

type TokenService interface {
	GenerateEmailInvitationToken(ctx context.Context, email string, roleIds []int) (string, error)
	GenerateAccessToken(ctx context.Context, id int, jti string) (string, error)
	GenerateRefreshToken(ctx context.Context, id int, jti string) (string, error)
}
