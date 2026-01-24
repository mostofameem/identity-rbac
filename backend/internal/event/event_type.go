package event

import (
	"context"
	"identity-rbac/internal/util"
)

func (s *service) GetEventTypeDetails(ctx context.Context, id int) (EventTypeResponse, error) {

	eventType, err := s.eventTypeRepo.GetByID(ctx, nil, id)
	if err != nil {
		return EventTypeResponse{}, util.ErrSomethingWentWrong
	}

	return EventTypeResponse{
		Id:          eventType.Id,
		Name:        eventType.Name,
		Description: eventType.Description,
		CreatedBy:   eventType.CreatedBy,
		IsActive:    eventType.IsActive,
		CreatedAt:   eventType.CreatedAt,
		UpdatedAt:   eventType.UpdatedAt,
	}, nil

}
