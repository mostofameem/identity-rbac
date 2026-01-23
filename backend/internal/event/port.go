package event

import (
	"context"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/util"

	"github.com/jmoiron/sqlx"
)

type Service interface {
	CreateEvent(ctx context.Context, req CreateEventReq) (*EventResponse, error)
	GetEvents(ctx context.Context, req GetEventsReq) ([]EventCustomerResponse, util.Pagination, error)
	GetEventDetails(ctx context.Context, id int) (EventResponse, error)

	ParticipateEvent(ctx context.Context, req PerticipateEventReq) (err error)

	CreateEventType(ctx context.Context, req CreateEventTypeReq) (int, error)
	GetEventTypes(ctx context.Context, req GetEventTypesReq) ([]GetEventTypeResponse, util.Pagination, error)
	UpdateEventTypeStatus(ctx context.Context, id int, status string) error

	EventTypeSettings(ctx context.Context, req EventTypeSettingsRequest) (int, error)
	GetEventTypeSettings(ctx context.Context, eventTypeID int) (EventTypeSettingsResponse, error)
}

type EventRepo interface {
	Create(ctx context.Context, req CreateEventReq) (int, error)
	GetByID(ctx context.Context, tx *sqlx.Tx, id int) (*entity.Events, error)
	GetByIDForUpdate(ctx context.Context, tx *sqlx.Tx, id int) (*entity.Events, error)
	GetEventWithPagination(ctx context.Context, req GetEventsQueryReq) ([]entity.Events, error)
	GetTotalEventCount(ctx context.Context, req GetEventsQueryReq) (int, error)
	UpdateParticipantCount(ctx context.Context, tx *sqlx.Tx, eventID, count int) error
}

type EventTypeRepo interface {
	GetByID(ctx context.Context, id int) (*entity.EventType, error)
	GetAllWithPagination(ctx context.Context, req GetEventTypesReq) ([]entity.EventType, error)
	GetTotalEventTypeCount(ctx context.Context, req GetEventTypesReq) (int, error)
	GetByName(ctx context.Context, name string) (*entity.EventType, error)
	Create(ctx context.Context, req CreateEventTypeReq) (int, error)
	GetByIDs(ctx context.Context, ids []int) ([]entity.EventType, error)
	UpdateIsActiveStatus(ctx context.Context, id int, isActive bool) error
}

type PerticipantRepo interface {
	Create(ctx context.Context, tx *sqlx.Tx, req PerticipateEventReq) error
	Exists(ctx context.Context, tx *sqlx.Tx, eventID, userID int) (bool, error)
}

type EventTypeSettingRepo interface {
	CreateOrUpsert(ctx context.Context, req EventTypeSettingsRequest) (int, error)
	GetByEventTypeID(ctx context.Context, eventTypeID int) (*entity.EventTypeSettings, error)
	Create(ctx context.Context, req EventTypeSettingsRequest) (int, error)
	Update(ctx context.Context, req EventTypeSettingsRequest) (int, error)
}

type TransactionRepo interface {
	BeginTx(ctx context.Context) (*sqlx.Tx, error)
	CommitTx(ctx context.Context, tx *sqlx.Tx) error
	RollbackTx(ctx context.Context, tx *sqlx.Tx) error
}
