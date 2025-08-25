package handlers

import (
	"identity-rbac/config"
	"identity-rbac/internal/rbac"
)

type Handlers struct {
	cnf     *config.Config
	rbacSvc rbac.Service
}

func NewHandlers(cnf *config.Config, rbacSvc rbac.Service) *Handlers {
	return &Handlers{
		cnf:     cnf,
		rbacSvc: rbacSvc,
	}
}
