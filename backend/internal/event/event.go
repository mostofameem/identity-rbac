package event

import (
	"context"
	"fmt"
	"identity-rbac/config"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/util"
	"log"
	"log/slog"
	"time"
)

const DEFAULT_PARTICIPANT_COUNT = 1

type service struct {
	cnf                  *config.Config
	eventRepo            EventRepo
	eventTypeRepo        EventTypeRepo
	eventTypeSettingRepo EventTypeSettingRepo
	perticipantRepo      PerticipantRepo
	eventSettingRepo     EventTypeSettingRepo
	transactionRepo      TransactionRepo
}

func NewEventSerVice(
	cnf *config.Config,
	eventRepo EventRepo,
	eventTypeRepo EventTypeRepo,
	eventTypeSettingRepo EventTypeSettingRepo,
	perticipantRepo PerticipantRepo,
	eventSettingRepo EventTypeSettingRepo,
	transactionRepo TransactionRepo,
) Service {
	return &service{
		cnf:                  cnf,
		eventRepo:            eventRepo,
		eventTypeRepo:        eventTypeRepo,
		eventTypeSettingRepo: eventTypeSettingRepo,
		perticipantRepo:      perticipantRepo,
		eventSettingRepo:     eventSettingRepo,
		transactionRepo:      transactionRepo,
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

func (s *service) EventTypeSettings(ctx context.Context, req EventTypeSettingsRequest) (int, error) {
	id, err := s.eventTypeSettingRepo.CreateOrUpsert(ctx, req)
	if err != nil {
		slog.Error("Failed to create event type settings", "error", err)
		return 0, err
	}

	return id, nil
}

func (s *service) GetEventTypeSettings(ctx context.Context, eventTypeID int) (EventTypeSettingsResponse, error) {
	eventTypeSettings, err := s.eventTypeSettingRepo.GetByEventTypeID(ctx, eventTypeID)

	if err != nil {
		return EventTypeSettingsResponse{}, err
	}

	// Format the time as HH:MM if it exists
	autoCreateAt := ""
	if eventTypeSettings.AutoCreateAt != nil && *eventTypeSettings.AutoCreateAt != "" {
		timeStr := *eventTypeSettings.AutoCreateAt
		// Try parsing with time.RFC3339 format first (for timestamps like "0000-01-01T12:00:00Z")
		t, err := time.Parse(time.RFC3339, timeStr)
		if err != nil {
			// If that fails, try parsing as just time (HH:MM:SS)
			t, err = time.Parse("15:04:05", timeStr)
		}
		if err == nil {
			autoCreateAt = t.Format("15:04")
		} else {
			autoCreateAt = timeStr
		}
	}

	return EventTypeSettingsResponse{
		Id:                         eventTypeSettings.Id,
		EventTypeId:                eventTypeSettings.EventTypeID,
		AutoCreateAt:               autoCreateAt,
		AutoEventIntervalInMinutes: eventTypeSettings.AutoEventIntervalInMinutes,
		CreatedBy:                  eventTypeSettings.CreatedBy,
		IsActive:                   eventTypeSettings.IsActive,
	}, nil
}

func getEventStatus(event *entity.Events, now time.Time) enum.EventStatusType {
	if !event.IsActive {
		return enum.EventStatusInactive
	}

	if now.Before(*event.RegistrationOpensAt) {
		return enum.EventStatusUpcoming
	}

	if now.After(*event.RegistrationClosesAt) {
		return enum.EventStatusRecent
	}

	return enum.EventStatusOngoing
}
