package event

import (
	"context"
	"identity-rbac/config"
	"identity-rbac/internal/util"
)

type service struct {
	cnf              *config.Config
	eventRepo        EventRepo
	eventTypeRepo    EventTypeRepo
	perticipantRepo  PerticipantRepo
	eventSettingRepo EventSettingRepo
}

func NewEventSerVice(cnf *config.Config, eventRepo EventRepo, eventTypeRepo EventTypeRepo, perticipantRepo PerticipantRepo, eventSettingRepo EventSettingRepo) Service {
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
		return nil, util.ErrNotFound
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
		Id:                   createdEvent.Id,
		Title:                createdEvent.Title,
		Description:          createdEvent.Description,
		EventTypeId:          createdEvent.EventTypeId,
		StartAt:              createdEvent.StartAt,
		RegistrationOpensAt:  createdEvent.RegistrationOpensAt,
		RegistrationClosesAt: createdEvent.RegistrationClosesAt,
		AutoEventCreate:      createdEvent.AutoEventCreate,
		CreatedBy:            createdEvent.CreatedBy,
		UpdatedBy:            createdEvent.UpdatedBy,
		Remarks:              createdEvent.Remarks,
		CreatedAt:            createdEvent.CreatedAt,
		UpdatedAt:            createdEvent.UpdatedAt,
		IsActive:             createdEvent.IsActive,
	}

	return response, nil
}
