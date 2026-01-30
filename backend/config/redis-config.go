package config

type RedisConfig struct {
	Host     string `mapstructure:"REDIS_HOST"     validate:"required"`
	Port     int    `mapstructure:"REDIS_PORT"     validate:"required"`
	Password string `mapstructure:"REDIS_PASSWORD"`
	DB       int    `mapstructure:"REDIS_DB"`
}
