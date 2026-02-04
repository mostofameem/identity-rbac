package redis

import (
	"context"
	"time"
)

type CacheService interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string) (string, error)
	Close() error
}

type TokenBucketRateLimiterService interface {
	IsAllowed(ctx context.Context, key string) (bool, error)
	GetParticipationKey(userId int) string
	GetGuestCountKey(userId int) string
	GetShouldAutoCreateEventKey(eventId int) string
	Close() error
}
