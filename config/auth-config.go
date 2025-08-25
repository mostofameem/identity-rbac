package config

type AuthConfig struct {
	ClientKey     string `mapstructure:"CLIENT_KEY"         validate:"required"`
	SessionSecret string `mapstructure:"SESSION_SECRET"        validate:"required"`
	CallBackUrl   string `mapstructure:"CALL_BACK_URL"      validate:"required"`
}
