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
	GetPublicEvents(ctx context.Context, req GetPublicEventsReq) ([]EventPublicResponse, util.Pagination, error)
	GetEventDetails(ctx context.Context, id int) (EventResponse, error)
	UpdateEventStatus(ctx context.Context, id int, status string) error

	PerticipateEvent(ctx context.Context, req PerticipateEventReq) (err error)
	MyEventPerticipations(ctx context.Context, req GetEventPerticipationsReq) ([]EventPerticipationDto, util.Pagination, error)

	CreateEventType(ctx context.Context, req CreateEventTypeReq) (int, error)
	GetEventTypes(ctx context.Context, req GetEventTypesReq) ([]GetEventTypeResponse, util.Pagination, error)
	GetEventTypeDetails(ctx context.Context, id int) (EventTypeResponse, error)
	UpdateEventTypeStatus(ctx context.Context, id int, status string) error

	EventTypeSettings(ctx context.Context, req EventTypeSettingsRequest) (int, error)
	GetEventTypeSettings(ctx context.Context, eventTypeID int) (EventTypeSettingsResponse, error)
}

type EventRepo interface {
	Create(ctx context.Context, req CreateEventReq) (int, error)
	GetByID(ctx context.Context, tx *sqlx.Tx, id int) (*entity.Events, error)
	GetByIDForUpdate(ctx context.Context, tx *sqlx.Tx, id int) (*entity.Events, error)
	GetEventWithPagination(ctx context.Context, req GetEventsQueryReq) ([]entity.Events, error)
	GetPublicEventWithPagination(ctx context.Context,title string, limit int, page int, status string) ([]EventPublicResponse, error)
	GetTotalPublicEventCount(ctx context.Context, status string) (int, error)
	GetTotalEventCount(ctx context.Context, req GetEventsQueryReq) (int, error)
	UpdateParticipantCount(ctx context.Context, tx *sqlx.Tx, eventID, count int) error
	UpdateIsActiveStatus(ctx context.Context, tx *sqlx.Tx, id int, isActive bool) error
}

type EventTypeRepo interface {
	GetByID(ctx context.Context, tx *sqlx.Tx, id int) (*entity.EventType, error)
	GetAllWithPagination(ctx context.Context, req GetEventTypesReq) ([]entity.EventType, error)
	GetTotalEventTypeCount(ctx context.Context, req GetEventTypesReq) (int, error)
	GetByName(ctx context.Context, name string) (*entity.EventType, error)
	Create(ctx context.Context, req CreateEventTypeReq) (int, error)
	GetByIDs(ctx context.Context, ids []int) ([]entity.EventType, error)
	UpdateIsActiveStatus(ctx context.Context, tx *sqlx.Tx, id int, isActive bool) error
}

type PerticipantRepo interface {
	Create(ctx context.Context, tx *sqlx.Tx, req PerticipateEventReq) error
	Exists(ctx context.Context, tx *sqlx.Tx, eventID, userID int) (bool, error)

	GetMyPerticipations(ctx context.Context, req GetEventPerticipationsReq) ([]EventPerticipationDto, error)
	GetMyPerticipationCount(ctx context.Context, req GetEventPerticipationsReq) (int, error)
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
