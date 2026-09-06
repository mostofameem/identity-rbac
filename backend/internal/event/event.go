package event

import (
	"context"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/util"
	"time"
)

func (s *service) CreateEvent(ctx context.Context, req CreateEventReq) (*EventResponse, error) {
	// Validate event type exists
	eventType, err := s.eventTypeRepo.GetByID(ctx, nil, req.EventTypeId)
	if err != nil {
		return nil, util.ErrSomethingWentWrong
	}
	if eventType == nil {
		return nil, util.ErrNotFound
	}

	// Enforce the hot event limit when the new event is flagged for auto creation
	if req.ShouldAutoCreateEvent {
		totalAutoCreateEvents, err := s.eventRepo.GetTotalAutoCreateEvents(ctx)
		if err != nil {
			return nil, util.ErrSomethingWentWrong
		}
		if totalAutoCreateEvents >= s.cnf.MaxHotEventLimit {
			return nil, util.ErrHotEventsLimitReached
		}
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
		Id:          createdEvent.Id,
		Title:       createdEvent.Title,
		Description: createdEvent.Description,
		EventTypeId: GetEventTypeDto{
			Id:       eventType.Id,
			Name:     eventType.Name,
			IsActive: eventType.IsActive,
		},
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

	eventType, err := s.eventTypeRepo.GetByID(ctx, nil, event.EventTypeId)
	if err != nil {
		return EventResponse{}, err
	}

	// Convert to response DTO
	response := &EventResponse{
		Id:          event.Id,
		Title:       event.Title,
		Description: event.Description,
		EventTypeId: GetEventTypeDto{
			Id:       eventType.Id,
			Name:     eventType.Name,
			IsActive: eventType.IsActive,
		},
		StartAt:               event.StartAt,
		RegistrationOpensAt:   event.RegistrationOpensAt,
		RegistrationClosesAt:  event.RegistrationClosesAt,
		ShouldAutoCreateEvent: event.ShouldAutoCreateEvent,
		TotalParticipants:     event.TotalParticipants,
		MaxParticipants:       event.MaxParticipants,
		Status:                string(getEventStatus(event, time.Now())),
		IsActive:              event.IsActive,
		CreatedBy:             event.CreatedBy,
		UpdatedBy:             event.UpdatedBy,
		Remarks:               event.Remarks,
		CreatedAt:             event.CreatedAt,
		UpdatedAt:             event.UpdatedAt,
	}

	return *response, nil

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
			IsActive:    eventType.IsActive,
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
			IsActive:             event.IsActive,
			Status:               getEventStatus(&event, req.CurrentTime),
			TotalParticipants:    event.TotalParticipants,
			MaxParticipants:      event.MaxParticipants,
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

func (s *service) GetPublicEvents(ctx context.Context, req GetPublicEventsReq) ([]EventPublicResponse, util.Pagination, error) {

	events, err := s.eventRepo.GetPublicEventWithPagination(ctx, req.UserId, req.Title, req.Limit, req.Page, string(req.EventStatus))
	if err != nil {
		return []EventPublicResponse{}, util.Pagination{}, util.ErrSomethingWentWrong
	}

	totalItem, err := s.eventRepo.GetTotalPublicEventCount(ctx, string(req.EventStatus))
	if err != nil {
		return []EventPublicResponse{}, util.Pagination{}, util.ErrSomethingWentWrong
	}
	pagination := util.GetPaginationResponse(totalItem, req.Page, req.Limit)

	return events, pagination, nil
}

func getEventStatus(event *entity.Events, now time.Time) enum.EventStatusType {
	if !event.IsActive {
		return enum.EventStatusInactive
	}

	if now.Before(event.RegistrationOpensAt) {
		return enum.EventStatusUpcoming
	}

	if now.After(event.RegistrationClosesAt) {
		return enum.EventStatusRecent
	}

	return enum.EventStatusOngoing
}

func (s *service) UpdateEventStatus(ctx context.Context, id int, status string) error {
	event, err := s.eventRepo.GetByID(ctx, nil, id)
	if err != nil {
		return util.ErrSomethingWentWrong
	}
	if event == nil {
		return util.ErrNotFound
	}

	tx, err := s.transactionRepo.BeginTx(ctx)
	if err != nil {
		return util.ErrSomethingWentWrong
	}
	defer s.transactionRepo.RollbackTx(ctx, tx)

	if err := s.eventRepo.UpdateIsActiveStatus(ctx, tx, id, status == "ACTIVE"); err != nil {
		return util.ErrSomethingWentWrong
	}

	return s.transactionRepo.CommitTx(ctx, tx)
}

func (s *service) UpdateShouldAutoCreateEventStatus(ctx context.Context, id int, status string) error {
	event, err := s.eventRepo.GetByID(ctx, nil, id)
	if err != nil {
		return util.ErrSomethingWentWrong
	}
	if event == nil {
		return util.ErrNotFound
	}

	shouldAutoCreateEvent := status == "ACTIVE"
	if event.ShouldAutoCreateEvent == shouldAutoCreateEvent {
		return util.ErrEventAlreadyInStatus
	}

	if shouldAutoCreateEvent {
		totalAutoCreateEvents, err := s.eventRepo.GetTotalAutoCreateEvents(ctx)
		if err != nil {
			return util.ErrSomethingWentWrong
		}
		if totalAutoCreateEvents >= s.cnf.MaxHotEventLimit {
			return util.ErrHotEventsLimitReached
		}
	}

	tx, err := s.transactionRepo.BeginTx(ctx)
	if err != nil {
		return util.ErrSomethingWentWrong
	}
	defer s.transactionRepo.RollbackTx(ctx, tx)

	if err := s.eventRepo.UpdateShouldAutoCreateEventStatus(ctx, tx, id, shouldAutoCreateEvent); err != nil {
		return util.ErrSomethingWentWrong
	}

	return s.transactionRepo.CommitTx(ctx, tx)
}
