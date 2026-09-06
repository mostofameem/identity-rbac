package event

import (
	"context"
	"errors"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/util"
)

func (s *service) UpdateEventTypeSettings(ctx context.Context, req EventTypeSettingsRequest) (int, error) {
	if !enum.RecurrenceType(req.Recurrence).IsValid() {
		return 0, util.ErrInvalidRecurrence
	}

	eventSetting, err := s.eventTypeSettingRepo.GetByEventTypeID(ctx, req.EventTypeId)
	if err != nil && !errors.Is(err, util.ErrNotFound) {
		return 0, util.ErrSomethingWentWrong
	}

	if eventSetting == nil {
		return 0, util.ErrNotFound
	}

	id, err := s.eventTypeSettingRepo.Update(ctx, req)
	if err != nil {
		return 0, util.ErrSomethingWentWrong
	}

	return id, nil
}

func (s *service) GetEventTypeSettings(ctx context.Context, eventTypeID int) (EventTypeSettingsResponse, error) {
	eventTypeSettings, err := s.eventTypeSettingRepo.GetByEventTypeID(ctx, eventTypeID)

	if err != nil {
		return EventTypeSettingsResponse{}, err
	}

	// auto_create_at is nullable — guard the dereference.
	autoCreateAt := ""
	if eventTypeSettings.AutoCreateAt != nil {
		autoCreateAt = *eventTypeSettings.AutoCreateAt
	}

	return EventTypeSettingsResponse{
		Id:           eventTypeSettings.Id,
		EventTypeId:  eventTypeSettings.EventTypeID,
		AutoCreateAt: autoCreateAt,
		Recurrence:   eventTypeSettings.Recurrence,
		CreatedBy:    eventTypeSettings.CreatedBy,
		IsActive:     eventTypeSettings.IsActive,
	}, nil
}
