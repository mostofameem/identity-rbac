package redis

import (
	"context"
	"identity-rbac/config"
	"strconv"
	"time"
)

const (
	TOKEN_BUCKET_RATE_LIMITER_PREFIX  = "rate_limit:"
	PARTICIPATION_RATE_LIMITER_PREFIX = "rate_limit:participation:"
	GUEST_COUNT_RATE_LIMITER_PREFIX   = "rate_limit:guest_count:"
	RATE_LIMIT_LUA_SCRIPT             = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

local delta = math.max(0, now - last_refill)
local refill = delta * refill_rate
tokens = math.min(capacity, tokens + refill)

local allowed = 0
if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
-- Set TTL to 1 minute as requested
redis.call('EXPIRE', key, 60)

return allowed
`
)

type tokenBucketRateLimiterService struct {
	client *Client
	cnf    *config.RateLimitConfig
}

func NewTokenBucketRateLimiterService(client *Client, cnf *config.RateLimitConfig) TokenBucketRateLimiterService {
	return &tokenBucketRateLimiterService{
		client: client,
		cnf:    cnf,
	}
}

func (t *tokenBucketRateLimiterService) IsAllowed(ctx context.Context, fullKey string) (bool, error) {
	now := float64(time.Now().Unix())
	refillRatePerSecond := t.cnf.RefillRatePerMinute / 60.0

	res, err := t.client.GetRDB().Eval(ctx, RATE_LIMIT_LUA_SCRIPT, []string{fullKey},
		t.cnf.Capacity,
		refillRatePerSecond,
		now,
	).Result()

	if err != nil {
		return false, err
	}

	return res.(int64) == 1, nil
}

func (t *tokenBucketRateLimiterService) Close() error {
	return t.client.Close()
}

func (t *tokenBucketRateLimiterService) GetParticipationKey(userID int) string {
	return PARTICIPATION_RATE_LIMITER_PREFIX + strconv.Itoa(userID)
}

func (t *tokenBucketRateLimiterService) GetGuestCountKey(userID int) string {
	return GUEST_COUNT_RATE_LIMITER_PREFIX + strconv.Itoa(userID)
}
