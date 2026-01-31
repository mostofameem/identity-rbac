package auth

import (
	"identity-rbac/config"

	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
)

func InitAuthSetting(cnf *config.AuthConfig) {
	key := []byte(cnf.SessionSecret)
	store := sessions.NewCookieStore(key)

	// Configure session options for local development
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   3600, // 1 hour
		HttpOnly: true,
		Secure:   false, // Must be false for local HTTP
		SameSite: 2,     // SameSiteLaxMode
	}

	gothic.Store = store

	goth.UseProviders(
		google.New(
			cnf.ClientKey,
			cnf.SessionSecret,
			cnf.CallBackUrl,
			"email", "profile",
		),
	)
}
