package handlers

import (
	"identity-rbac/config"
	"identity-rbac/internal/event"
	"identity-rbac/internal/rbac"
)

type Handlers struct {
	cnf      *config.Config
	rbacSvc  rbac.Service
	eventSvc event.Service
}

func NewHandlers(cnf *config.Config, rbacSvc rbac.Service, eventSvc event.Service) *Handlers {
	return &Handlers{
		cnf:      cnf,
		rbacSvc:  rbacSvc,
		eventSvc: eventSvc,
	}
}
