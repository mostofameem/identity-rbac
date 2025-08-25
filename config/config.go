package config

import "sync"

var cntOnce = sync.Once{}

type Mode string

const DebugMode = Mode("debug")
const ReleaseMode = Mode("release")

type Config struct {
	Mode                   Mode   `mapstructure:"MODE"         validate:"required"`
	ServiceName            string `mapstructure:"SERVICE_NAME" validate:"required"`
	HttpPort               int    `mapstructure:"HTTP_PORT"    validate:"required"`
	JwtSecret              string `mapstructure:"JWT_SECRET"  validate:"required"`
	DB                     *DBConfig
	Auth                   *AuthConfig
	MigrationSource        string `mapstructure:"MIGRATION_SOURCE" validate:"required"`
	TokenExpireTimeInHours int    `mapstructure:"TOKEN_EXPIRE_TIME_IN_HOURS" validate:"required"`
}

var config *Config

func GetConfig() *Config {
	cntOnce.Do(func() {
		LoadConfig()
	})
	return config
}
