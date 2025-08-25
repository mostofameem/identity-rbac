package config

type DBConfig struct {
	Host                 string `mapstructure:"DB_HOST"                     validate:"required"`
	Port                 int    `mapstructure:"DB_PORT"                     validate:"required"`
	Name                 string `mapstructure:"DB_NAME"                     validate:"required"`
	User                 string `mapstructure:"DB_USER"                     validate:"required"`
	Password             string `mapstructure:"DB_PASS"                     validate:"required"`
	MaxOpenConnections   int    `mapstructure:"MAX_OPEN_CONNECTIONS"        validate:"required"`
	MaxIdleConnections   int    `mapstructure:"MAX_IDLE_CONNECTIONS"        validate:"required"`
	MaxIdleTimeInMinutes int    `mapstructure:"MAX_IDLE_TIME_IN_MINUTES"    validate:"required"`
	EnableSSLMode        bool   `mapstructure:"ENABLE_SSL_MODE"`
}
