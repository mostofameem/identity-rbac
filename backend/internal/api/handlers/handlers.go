package handlers

import (
	"identity-rbac/config"
	"identity-rbac/internal/event"
	"identity-rbac/internal/rbac"
	"identity-rbac/internal/redis"
)

type Handlers struct {
	cnf            *config.Config
	rbacSvc        rbac.Service
	eventSvc       event.Service
	rateLimiterSvc redis.TokenBucketRateLimiterService
}

func NewHandlers(cnf *config.Config, rbacSvc rbac.Service, eventSvc event.Service, rateLimiterSvc redis.TokenBucketRateLimiterService) *Handlers {
	return &Handlers{
		cnf:            cnf,
		rbacSvc:        rbacSvc,
		eventSvc:       eventSvc,
		rateLimiterSvc: rateLimiterSvc,
	}
}
