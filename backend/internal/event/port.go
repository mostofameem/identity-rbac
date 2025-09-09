package event

import (
	"context"
	"identity-rbac/internal/entity"
)

type Service interface {
	CreateEvent(ctx context.Context, req CreateEventReq) (*EventResponse, error)
}

type EventRepo interface {
	Create(ctx context.Context, req CreateEventReq) (int, error)
	GetByID(ctx context.Context, id int) (*entity.Events, error)
}

type EventTypeRepo interface {
	GetByID(ctx context.Context, id int) (*entity.EventType, error)
}

type PerticipantRepo interface {
}

type EventSettingRepo interface {
}
