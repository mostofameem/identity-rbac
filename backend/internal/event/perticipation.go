package event

import (
	"context"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/util"
	"log"
)

func (s *service) PerticipateEvent(ctx context.Context, req PerticipateEventReq) (err error) {
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
	exists, err := s.participantRepo.Exists(ctx, tx, req.EventId, req.UserId)
	if err != nil {
		log.Printf("Failed to check participation: %v\n", err)
		return util.ErrSomethingWentWrong
	}
	if exists {
		return util.ErrAlreadyRegistered
	}

	if err = s.participantRepo.Create(ctx, tx, req); err != nil {
		log.Printf("Failed to create participant: %v\n", err)
		return util.ErrSomethingWentWrong
	}

	if err = s.eventRepo.UpdateParticipantCount(ctx, tx, req.EventId, totalParticipants); err != nil {
		log.Printf("Failed to update participant count: %v\n", err)
		return util.ErrSomethingWentWrong
	}

	return nil
}

func (s *service) MyEventPerticipations(ctx context.Context, req GetEventPerticipationsReq) ([]EventPerticipationDto, util.Pagination, error) {
	perticipateHistory, err := s.participantRepo.GetMyPerticipations(ctx, req)
	if err != nil {
		return nil, util.Pagination{}, err
	}

	count, err := s.participantRepo.GetMyPerticipationCount(ctx, req)
	if err != nil {
		return nil, util.Pagination{}, err
	}

	return perticipateHistory, util.Pagination{
		Page:      req.Page,
		Limit:     req.Limit,
		TotalPage: (count + req.Limit - 1) / req.Limit,
		TotalItem: count,
	}, nil
}

func (s *service) UpdatePerticipation(ctx context.Context, req UpdatePerticipationStatusReq) error {
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

	// Prevent duplicate participation
	participantInfo, err := s.participantRepo.GetByID(ctx, tx, req.EventId, req.UserId)
	if err != nil {
		return util.ErrSomethingWentWrong
	}
	if participantInfo == nil {
		return util.ErrNotFound
	}

	if participantInfo.Status == string(req.Status) {
		if req.Status == enum.PerticepateStatusCanceled {
			return util.ErrAlreadyCanceled
		}
		return util.ErrAlreadyGoing
	}

	if err = s.participantRepo.UpdateStatus(ctx, tx, req); err != nil {
		return util.ErrSomethingWentWrong
	}

	switch req.Status {
	case enum.PerticepateStatusCanceled:
		if err = s.eventRepo.UpdateParticipantCount(ctx, tx, req.EventId, event.TotalParticipants-1); err != nil {
			return util.ErrSomethingWentWrong
		}
	case enum.PerticepateStatusGoing:
		if err = s.eventRepo.UpdateParticipantCount(ctx, tx, req.EventId, event.TotalParticipants+1); err != nil {
			return util.ErrSomethingWentWrong
		}
	}

	return nil
}

func (s *service) UpdateGuestCount(ctx context.Context, userId int, eventId int, guestCount int) error {
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

	participantInfo, err := s.participantRepo.GetByID(ctx, tx, userId, eventId)
	if err != nil {
		return util.ErrSomethingWentWrong
	}
	if participantInfo == nil {
		return util.ErrNotFound
	}

	event, err := s.eventRepo.GetByIDForUpdate(ctx, tx, eventId)
	if err != nil {
		return util.ErrSomethingWentWrong
	}
	if event == nil {
		return util.ErrEventNotFound
	}

	perticipationCountUpdated := getUpdatedParticipantCount(participantInfo.GuestCount, guestCount)

	if event.TotalParticipants+perticipationCountUpdated > event.MaxParticipants {
		return util.ErrEventMaxParticipantsExceeded
	}

	if err = s.participantRepo.UpdateGuestCount(ctx, tx, userId, eventId, guestCount); err != nil {
		return util.ErrSomethingWentWrong
	}

	if err = s.eventRepo.UpdateParticipantCount(ctx, tx, eventId, event.TotalParticipants+perticipationCountUpdated); err != nil {
		return util.ErrSomethingWentWrong
	}

	return nil
}

func getUpdatedParticipantCount(currentGuestCount, updatedGuestCount int) int {
	return updatedGuestCount - currentGuestCount
}
