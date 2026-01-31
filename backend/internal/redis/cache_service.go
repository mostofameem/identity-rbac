package redis

import (
	"context"
	"time"
)

type cacheService struct {
	client *Client
}

func NewCacheService(client *Client) CacheService {
	return &cacheService{client: client}
}

func (c *cacheService) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return c.client.Set(ctx, key, value, expiration)
}

func (c *cacheService) Get(ctx context.Context, key string) (string, error) {
	return c.client.Get(ctx, key)
}

func (c *cacheService) Close() error {
	return c.client.Close()
}
