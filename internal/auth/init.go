package auth

import (
	"identity-rbac/config"

	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
)

func InitAuthSetting(cnf *config.AuthConfig) {
	goth.UseProviders(
		google.New(
			cnf.ClientKey,
			cnf.SessionSecret,
			cnf.CallBackUrl,
			"email", "profile",
		),
	)
}
