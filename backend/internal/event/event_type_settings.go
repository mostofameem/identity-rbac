package event

import (
	"context"
	"identity-rbac/internal/util"
	"log/slog"
)

func (s *service) EventTypeSettings(ctx context.Context, req EventTypeSettingsRequest) (int, error) {
	eventSetting, err := s.eventSettingRepo.GetByEventTypeID(ctx, req.EventTypeId)
	if err != nil {
		return 0, util.ErrSomethingWentWrong
	}

	if eventSetting != nil {
		id, err := s.eventSettingRepo.Update(ctx, req)
		if err != nil {
			return 0, util.ErrSomethingWentWrong
		}

		return id, nil
	}

	id, err := s.eventTypeSettingRepo.Create(ctx, req)
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

	return EventTypeSettingsResponse{
		Id:                         eventTypeSettings.Id,
		EventTypeId:                eventTypeSettings.EventTypeID,
		AutoCreateAt:               *eventTypeSettings.AutoCreateAt,
		AutoEventIntervalInMinutes: eventTypeSettings.AutoEventIntervalInMinutes,
		CreatedBy:                  eventTypeSettings.CreatedBy,
		IsActive:                   eventTypeSettings.IsActive,
	}, nil
}
