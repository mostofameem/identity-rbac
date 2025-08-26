package config

import (
	"log/slog"
	"os"

	"github.com/go-playground/validator"
	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

func LoadConfig() error {

	exit := func(err error) {
		slog.Error(err.Error())
		os.Exit(1)
	}

	err := godotenv.Load()
	if err != nil {
		slog.Warn(".env not found, that's okay!")
	}

	viper.AutomaticEnv()

	config = &Config{
		Mode:                   Mode(viper.GetString("MODE")),
		ServiceName:            viper.GetString("SERVICE_NAME"),
		HttpPort:               viper.GetInt("HTTP_PORT"),
		JwtSecret:              viper.GetString("JWT_SECRET"),
		MigrationSource:        viper.GetString("MIGRATION_SOURCE"),
		TokenExpireTimeInHours: viper.GetInt("TOKEN_EXPIRE_TIME_IN_HOURS"),
		EmailInvitationTTL:     viper.GetInt("EMAIL_INVITATION_TTL_IN_MINUTE"),
		AccessTokenTTL:         viper.GetInt("ACCESS_TOKEN_TTL_IN_MINUTE"),
		RefreshTokenTTL:        viper.GetInt("REFRESH_TOKEN_TTL_IN_MINUTE"),
		DB: &DBConfig{
			Host:                 viper.GetString("DB_HOST"),
			Port:                 viper.GetInt("DB_PORT"),
			Name:                 viper.GetString("DB_NAME"),
			User:                 viper.GetString("DB_USER"),
			Password:             viper.GetString("DB_PASS"),
			MaxOpenConnections:   viper.GetInt("MAX_OPEN_CONNECTIONS"),
			MaxIdleConnections:   viper.GetInt("MAX_IDLE_CONNECTIONS"),
			MaxIdleTimeInMinutes: viper.GetInt("MAX_IDLE_TIME_IN_MINUTE"),
			EnableSSLMode:        viper.GetBool("ENABLE_SSL_MODE"),
		},
		Auth: &AuthConfig{
			ClientKey:     viper.GetString("CLIENT_KEY"),
			SessionSecret: viper.GetString("SESSION_SECRET"),
			CallBackUrl:   viper.GetString("CALL_BACK_URL"),
		},
		Mail: &MailConfig{
			Host:        viper.GetString("MAIL_HOST"),
			Port:        viper.GetInt("MAIL_PORT"),
			Username:    viper.GetString("MAIL_USERNAME"),
			Email:       viper.GetString("MAIL_EMAIL"),
			Password:    viper.GetString("MAIL_PASSWORD"),
			FrontendURL: viper.GetString("FRONTEND_URL"),
		},
	}

	v := validator.New()
	if err = v.Struct(config); err != nil {
		exit(err)
	}

	return nil
}
