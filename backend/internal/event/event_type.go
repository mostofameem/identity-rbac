package event

import (
	"context"
	"identity-rbac/internal/util"
	"log/slog"
)

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
			IsActive:    eventType.IsActive,
		}
	}

	totalItem, err := s.eventTypeRepo.GetTotalEventTypeCount(ctx, req)
	if err != nil {
		return []GetEventTypeResponse{}, util.Pagination{}, util.ErrSomethingWentWrong
	}
	pagination := util.GetPaginationResponse(totalItem, req.Page, req.Limit)

	return eventTypeRes, pagination, nil
}

func (s *service) UpdateEventTypeStatus(ctx context.Context, id int, status string) error {

	tx, err := s.transactionRepo.BeginTx(ctx)
	if err != nil {
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

	eventType, err := s.eventTypeRepo.GetByID(ctx, tx, id)
	if err != nil {
		slog.Error("Failed to get event type", "error", err)
		return util.ErrSomethingWentWrong
	}

	if eventType == nil {
		slog.Error("Event type not found", "id", id)
		return util.ErrNotFound
	}

	isActive := status == "ACTIVE"

	err = s.eventTypeRepo.UpdateIsActiveStatus(ctx, tx, id, isActive)
	if err != nil {
		return util.ErrSomethingWentWrong
	}

	return nil
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
			IsActive:    eventType.IsActive,
		}
	}

	return eventTypeResponse, nil
}
