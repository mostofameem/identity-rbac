package event

import (
	"context"
	"fmt"
	"identity-rbac/config"
	"identity-rbac/internal/util"
)

type service struct {
	cnf              *config.Config
	eventRepo        EventRepo
	eventTypeRepo    EventTypeRepo
	perticipantRepo  PerticipantRepo
	eventSettingRepo EventTypeSettingRepo
}

func NewEventSerVice(
	cnf *config.Config,
	eventRepo EventRepo,
	eventTypeRepo EventTypeRepo,
	perticipantRepo PerticipantRepo,
	eventSettingRepo EventTypeSettingRepo,
) Service {
	return &service{
		cnf:              cnf,
		eventRepo:        eventRepo,
		eventTypeRepo:    eventTypeRepo,
		perticipantRepo:  perticipantRepo,
		eventSettingRepo: eventSettingRepo,
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
	createdEvent, err := s.eventRepo.GetByID(ctx, eventId)
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
