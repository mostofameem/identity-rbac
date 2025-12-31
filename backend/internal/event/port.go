package event

import (
	"context"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/util"
)

type Service interface {
	CreateEvent(ctx context.Context, req CreateEventReq) (*EventResponse, error)

	CreateEventType(ctx context.Context, req CreateEventTypeReq) (int, error)
	GetEventTypes(ctx context.Context, req GetEventTypesReq) ([]GetEventTypeResponse, util.Pagination, error)
}

type EventRepo interface {
	Create(ctx context.Context, req CreateEventReq) (int, error)
	GetByID(ctx context.Context, id int) (*entity.Events, error)
}

type EventTypeRepo interface {
	GetByID(ctx context.Context, id int) (*entity.EventType, error)
	GetAllWithPagination(ctx context.Context, req GetEventTypesReq) ([]entity.EventType, error)
	GetTotalEventTypeCount(ctx context.Context, req GetEventTypesReq) (int, error)
	GetByName(ctx context.Context, name string) (*entity.EventType, error)
	Create(ctx context.Context, req CreateEventTypeReq) (int, error)
}

type PerticipantRepo interface {
}

type EventSettingRepo interface {
}
