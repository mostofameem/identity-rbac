package event

import (
	"context"
	"fmt"
	"identity-rbac/config"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/util"
	"log"
	"time"
)

const DEFAULT_PARTICIPANT_COUNT = 1

type service struct {
	cnf              *config.Config
	eventRepo        EventRepo
	eventTypeRepo    EventTypeRepo
	perticipantRepo  PerticipantRepo
	eventSettingRepo EventTypeSettingRepo
	transactionRepo  TransactionRepo
}

func NewEventSerVice(
	cnf *config.Config,
	eventRepo EventRepo,
	eventTypeRepo EventTypeRepo,
	perticipantRepo PerticipantRepo,
	eventSettingRepo EventTypeSettingRepo,
	transactionRepo TransactionRepo,
) Service {
	return &service{
		cnf:              cnf,
		eventRepo:        eventRepo,
		eventTypeRepo:    eventTypeRepo,
		perticipantRepo:  perticipantRepo,
		eventSettingRepo: eventSettingRepo,
		transactionRepo:  transactionRepo,
	}
}

func (s *service) CreateEvent(ctx context.Context, req CreateEventReq) (*EventResponse, error) {
	// Validate event type exists
	eventType, err := s.eventTypeRepo.GetByID(ctx, req.EventTypeId)
	if err != nil {
		return nil, err
	}
	if eventType == nil {
		return nil, fmt.Errorf("Event type not found.")
	}

	// Create the event
	eventId, err := s.eventRepo.Create(ctx, req)
	if err != nil {
		return nil, err
	}

	// Retrieve the created event
	createdEvent, err := s.eventRepo.GetByID(ctx, nil, eventId)
	if err != nil {
		return nil, err
	}

	// Convert to response DTO
	response := &EventResponse{
		Id:                    createdEvent.Id,
		Title:                 createdEvent.Title,
		Description:           createdEvent.Description,
		EventTypeId:           createdEvent.EventTypeId,
		StartAt:               createdEvent.StartAt,
		RegistrationOpensAt:   createdEvent.RegistrationOpensAt,
		RegistrationClosesAt:  createdEvent.RegistrationClosesAt,
		ShouldAutoCreateEvent: createdEvent.ShouldAutoCreateEvent,
		TotalParticipants:     createdEvent.TotalParticipants,
		IsActive:              createdEvent.IsActive,
		CreatedBy:             createdEvent.CreatedBy,
		UpdatedBy:             createdEvent.UpdatedBy,
		Remarks:               createdEvent.Remarks,
		CreatedAt:             createdEvent.CreatedAt,
		UpdatedAt:             createdEvent.UpdatedAt,
	}

	return response, nil
}

func (s *service) GetEventDetails(ctx context.Context, id int) (EventResponse, error) {

	event, err := s.eventRepo.GetByID(ctx, nil, id)
	if err != nil {
		return EventResponse{}, err
	}

	if event == nil {
		return EventResponse{}, util.ErrNotFound
	}

	// Convert to response DTO
	response := &EventResponse{
		Id:                    event.Id,
		Title:                 event.Title,
		Description:           event.Description,
		EventTypeId:           event.EventTypeId,
		StartAt:               event.StartAt,
		RegistrationOpensAt:   event.RegistrationOpensAt,
		RegistrationClosesAt:  event.RegistrationClosesAt,
		ShouldAutoCreateEvent: event.ShouldAutoCreateEvent,
		TotalParticipants:     event.TotalParticipants,
		IsActive:              event.IsActive,
		CreatedBy:             event.CreatedBy,
		UpdatedBy:             event.UpdatedBy,
		Remarks:               event.Remarks,
		CreatedAt:             event.CreatedAt,
		UpdatedAt:             event.UpdatedAt,
	}

	return *response, nil

}

func (s *service) CreateEventType(ctx context.Context, req CreateEventTypeReq) (int, error) {

	eventType, err := s.eventTypeRepo.GetByName(ctx, req.Name)
	if err != nil {
		return 0, err
	}
	if eventType != nil {
		return 0, util.ErrAlreadyExist
	}

	id, err := s.eventTypeRepo.Create(ctx, req)

	return id, err
}

func (s *service) GetEventTypes(ctx context.Context, req GetEventTypesReq) ([]GetEventTypeResponse, util.Pagination, error) {

	eventTypes, err := s.eventTypeRepo.GetAllWithPagination(ctx, req)
	if err != nil {
		return []GetEventTypeResponse{}, util.Pagination{}, util.ErrSomethingWentWrong
	}

	eventTypeRes := make([]GetEventTypeResponse, len(eventTypes))
	for i, eventType := range eventTypes {
		eventTypeRes[i] = GetEventTypeResponse{
			Id:          eventType.Id,
			Name:        eventType.Name,
			Description: eventType.Description,
		}
	}

	totalItem, err := s.eventTypeRepo.GetTotalEventTypeCount(ctx, req)
	if err != nil {
		return []GetEventTypeResponse{}, util.Pagination{}, util.ErrSomethingWentWrong
	}
	pagination := util.GetPaginationResponse(totalItem, req.Page, req.Limit)

	return eventTypeRes, pagination, nil
}

func (s *service) GetEvents(ctx context.Context, req GetEventsReq) ([]EventCustomerResponse, util.Pagination, error) {

	events, err := s.eventRepo.GetEventWithPagination(ctx, GetEventsQueryReq{
		Title:       req.Title,
		Page:        req.Page,
		Limit:       req.Limit,
		EventStatus: req.EventStatus,
		CurrentTime: req.CurrentTime,
	})
	if err != nil {
		return []EventCustomerResponse{}, util.Pagination{}, util.ErrSomethingWentWrong
	}

	uniqueEventTypes := make([]int, 0, len(events))
	seen := make(map[int]struct{})

	for _, event := range events {
		if _, ok := seen[event.EventTypeId]; !ok {
			seen[event.EventTypeId] = struct{}{}
			uniqueEventTypes = append(uniqueEventTypes, event.EventTypeId)
		}
	}

	eventTypeResponse, err := s.getEventTypesWhereIdsIn(ctx, uniqueEventTypes)
	eventTypes := make(map[int]GetEventTypeResponse)
	for _, eventType := range eventTypeResponse {
		eventTypes[eventType.Id] = GetEventTypeResponse{
			Id:          eventType.Id,
			Name:        eventType.Name,
			Description: eventType.Description,
		}
	}

	eventTypeRes := make([]EventCustomerResponse, len(events))
	for i, event := range events {
		eventTypeRes[i] = EventCustomerResponse{
			Id:                   event.Id,
			Title:                event.Title,
			Description:          event.Description,
			EventType:            eventTypes[event.EventTypeId],
			StartAt:              event.StartAt,
			RegistrationOpensAt:  event.RegistrationOpensAt,
			RegistrationClosesAt: event.RegistrationClosesAt,
		}
	}

	totalItem, err := s.eventRepo.GetTotalEventCount(ctx, GetEventsQueryReq{
		Title:       req.Title,
		EventStatus: req.EventStatus,
		CurrentTime: req.CurrentTime,
	})
	if err != nil {
		return []EventCustomerResponse{}, util.Pagination{}, util.ErrSomethingWentWrong
	}
	pagination := util.GetPaginationResponse(totalItem, req.Page, req.Limit)

	return eventTypeRes, pagination, nil
}

func (s *service) getEventTypesWhereIdsIn(ctx context.Context, eventTypeIds []int) ([]GetEventTypeResponse, error) {
	eventTypes, err := s.eventTypeRepo.GetByIDs(ctx, eventTypeIds)
	if err != nil {
		return []GetEventTypeResponse{}, err
	}

	eventTypeResponse := make([]GetEventTypeResponse, len(eventTypes))
	for i, eventType := range eventTypes {
		eventTypeResponse[i] = GetEventTypeResponse{
			Id:          eventType.Id,
			Name:        eventType.Name,
			Description: eventType.Description,
		}
	}

	return eventTypeResponse, nil
}

func (s *service) ParticipateEvent(ctx context.Context, req PerticipateEventReq) (err error) {
	tx, err := s.transactionRepo.BeginTx(ctx)
	if err != nil {
		log.Printf("Failed to begin transaction: %v\n", err)
		return util.ErrSomethingWentWrong
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
		if err != nil {
			_ = tx.Rollback()
			return
		}
		err = tx.Commit()
	}()

	// IMPORTANT: row lock
	event, err := s.eventRepo.GetByIDForUpdate(ctx, tx, req.EventId)
	if err != nil {
		log.Printf("Failed to get event: %v\n", err)
		return util.ErrSomethingWentWrong
	}
	if event == nil {
		return util.ErrEventNotFound
	}

	totalParticipants := event.TotalParticipants + req.GuestCount + DEFAULT_PARTICIPANT_COUNT

	if err = validateParticipation(event, req.CurrentTime, totalParticipants); err != nil {
		return err
	}

	// Prevent duplicate participation
	exists, err := s.perticipantRepo.Exists(ctx, tx, req.EventId, req.UserId)
	if err != nil {
		log.Printf("Failed to check participation: %v\n", err)
		return util.ErrSomethingWentWrong
	}
	if exists {
		return util.ErrAlreadyRegistered
	}

	if err = s.perticipantRepo.Create(ctx, tx, req); err != nil {
		log.Printf("Failed to create participant: %v\n", err)
		return util.ErrSomethingWentWrong
	}

	if err = s.eventRepo.UpdateParticipantCount(ctx, tx, req.EventId, totalParticipants); err != nil {
		log.Printf("Failed to update participant count: %v\n", err)
		return util.ErrSomethingWentWrong
	}

	return nil
}

func validateParticipation(event *entity.Events, now time.Time, totalParticipants int) error {
	if !event.IsActive {
		return util.ErrEventNotActive
	}

	if event.RegistrationOpensAt == nil || event.RegistrationClosesAt == nil {
		return util.ErrEventRegistrationTimeNotInRange
	}

	if now.Before(*event.RegistrationOpensAt) || now.After(*event.RegistrationClosesAt) {
		return util.ErrEventAlreadyEnded
	}

	if totalParticipants > event.MaxParticipants {
		return util.ErrEventMaxParticipantsExceeded
	}

	return nil
}
