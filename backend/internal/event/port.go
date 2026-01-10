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
	GetEvents(ctx context.Context, req GetEventsReq) ([]EventCustomerResponse, util.Pagination, error)
}

type EventRepo interface {
	Create(ctx context.Context, req CreateEventReq) (int, error)
	GetByID(ctx context.Context, id int) (*entity.Events, error)
	GetEventWithPagination(ctx context.Context, req GetEventsQueryReq) ([]entity.Events, error)
	GetTotalEventCount(ctx context.Context, req GetEventsQueryReq) (int, error)
}

type EventTypeRepo interface {
	GetByID(ctx context.Context, id int) (*entity.EventType, error)
	GetAllWithPagination(ctx context.Context, req GetEventTypesReq) ([]entity.EventType, error)
	GetTotalEventTypeCount(ctx context.Context, req GetEventTypesReq) (int, error)
	GetByName(ctx context.Context, name string) (*entity.EventType, error)
	Create(ctx context.Context, req CreateEventTypeReq) (int, error)
	GetByIDs(ctx context.Context, ids []int) ([]entity.EventType, error)
}

type PerticipantRepo interface {
}

type EventTypeSettingRepo interface {
}
