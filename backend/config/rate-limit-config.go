package config

type RateLimitConfig struct {
	Capacity            int     `mapstructure:"RATE_LIMIT_CAPACITY" default:"10"`
	RefillRatePerMinute float64 `mapstructure:"RATE_LIMIT_REFILL_RATE_PER_MINUTE" default:"10"`
}
