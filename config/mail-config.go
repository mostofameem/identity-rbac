package config

type MailConfig struct {
	Host     string `mapstructure:"MAIL_HOST"                     validate:"required"`
	Port     int    `mapstructure:"MAIL_PORT"                     validate:"required"`
	Username string `mapstructure:"MAIL_USERNAME"                 validate:"required"`
	Email    string `mapstructure:"MAIL_EMAIL"                    validate:"required"`
	Password string `mapstructure:"MAIL_PASSWORD"                 validate:"required"`
}
