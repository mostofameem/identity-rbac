package worker

import (
	"context"
	"identity-rbac/config"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/redis"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"
)

type autoEventCreateWorker struct {
	cnf                   *config.Config
	eventRepo             EventRepo
	evevtTypeSettingsRepo EventTypeSettingsRepo
	workerTransactionRepo WorkerTransactionRepo
	hotEventsRepo         HotEventsRepo
	cache                 redis.CacheService
}

func NewAutoEventCreateWorker(
	cnf *config.Config,
	eventRepo EventRepo,
	eventTypeSettingsRepo EventTypeSettingsRepo,
	workerTransactionRepo WorkerTransactionRepo,
	hotEventsRepo HotEventsRepo,
	cache redis.CacheService) AutoEventCreateWorkerService {
	return &autoEventCreateWorker{
		cnf:                   cnf,
		eventRepo:             eventRepo,
		evevtTypeSettingsRepo: eventTypeSettingsRepo,
		hotEventsRepo:         hotEventsRepo,
		workerTransactionRepo: workerTransactionRepo,
		cache:                 cache,
	}
}

const autoEventRemarks = "System created event"

func (a *autoEventCreateWorker) Run(ctx context.Context) {
	slog.Info("Background worker started")
	ticker := time.NewTicker(time.Minute * time.Duration(a.cnf.AutoEventCreateWorkerDelayInMinutes))
	defer ticker.Stop()

	// Initial auto event creation
	a.doAutoEventCreation(ctx)

	for {
		select {
		case <-ctx.Done():
			slog.Info("Background worker stopping...")
			return
		case <-ticker.C:
			a.doAutoEventCreation(ctx)
		}
	}
}

// run a function after a delay of config.auto_event_create_worker_delay minutes

// fetch events that are hot

// for each event verify if current time is after event_settings.auto_create_at
//	// if yes,
// 		// check if  current_time - hot_event.last_recreated_hot_event >= event_settings.auto_create_at
// 		//	if yes,
// 			// update the last_recreated_hot_event
// 			// create a new event with new start_at, registration_opens_at, registration_closes_at
// 		//	if no,
// 			// do nothing

func (a *autoEventCreateWorker) doAutoEventCreation(ctx context.Context) {
	hotevents, err := a.hotEventsRepo.GetHotEvents(ctx, nil)
	if err != nil {
		slog.Error("failed to fetch hot events", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return
	}

	if hotevents == nil {
		slog.Info("no hot events found")
		return
	}

	slog.Info("fetched hot events", logger.Extra(map[string]any{
		"total_hot_events": len(hotevents),
	}))

	var eventIds, eventTypeIds []int
	for _, hotEvent := range hotevents {
		eventIds = append(eventIds, hotEvent.EventId)
		eventTypeIds = append(eventTypeIds, hotEvent.EventTypeId)
	}

	if len(eventIds) == 0 {
		return
	}

	events := a.eventRepo.GetEventDetailsIn(ctx, eventIds...)
	mapEvents := make(map[int]entity.Events)
	for _, event := range events {
		mapEvents[event.Id] = event
	}

	eventTypeSettings := a.evevtTypeSettingsRepo.GetEventTypeSettingsIn(ctx, eventTypeIds...)

	mapEventTypeSettings := make(map[int]entity.EventTypeSettings)
	for _, eventTypeSetting := range eventTypeSettings {
		mapEventTypeSettings[eventTypeSetting.EventTypeID] = eventTypeSetting
	}

	now := time.Now()

	for _, hotEvent := range hotevents {
		event, ok := mapEvents[hotEvent.EventId]
		if !ok {
			continue
		}

		settings, ok := mapEventTypeSettings[hotEvent.EventTypeId]
		if !ok {
			continue
		}

		slog.Info("fetched event and settings", logger.Extra(map[string]any{
			"event":    event,
			"settings": settings,
		}))

		// Check if current time is after event_settings.auto_create_at
		if settings.AutoCreateAt != nil {
			autoCreateTime, err := time.Parse("15:04:05", *settings.AutoCreateAt)
			if err == nil {
				todayCreateTime := time.Date(now.Year(), now.Month(), now.Day(), autoCreateTime.Hour(), autoCreateTime.Minute(), autoCreateTime.Second(), 0, now.Location())
				if now.Before(todayCreateTime) {
					continue
				}
			}
		}

		// newStartDate = today's date + original StartAt's time-of-day
		newStartDate := time.Date(now.Year(), now.Month(), now.Day(),
			event.StartAt.Hour(), event.StartAt.Minute(), event.StartAt.Second(), 0, now.Location())

		// Preserve the original gaps between StartAt and the registration dates
		registrationOpensAtDiff := event.StartAt.Sub(event.RegistrationOpensAt)
		registrationClosesAtDiff := event.StartAt.Sub(event.RegistrationClosesAt)

		event.StartAt = newStartDate
		event.RegistrationOpensAt = newStartDate.Add(-registrationOpensAtDiff)
		event.RegistrationClosesAt = newStartDate.Add(-registrationClosesAtDiff)
		event.Remarks = util.Ptr(autoEventRemarks)
		a.createNewEvent(ctx, event)
	}
}

func (a *autoEventCreateWorker) createNewEvent(ctx context.Context, event entity.Events) {
	tx, err := a.workerTransactionRepo.BeginTx(ctx)
	if err != nil {
		slog.Error("failed to begin transaction", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return
	}
	defer func() {
		if err != nil {
			a.workerTransactionRepo.RollbackTx(ctx, tx)
		}
	}()

	if err = a.eventRepo.AutoCreateEvent(ctx, event); err != nil {
		return
	}
	slog.Info("created new event", logger.Extra(map[string]any{
		"event": event,
	}))

	if err = a.hotEventsRepo.UpdateLastRecreatedHotEvent(ctx, tx, event.Id, event.EventTypeId); err != nil {
		return
	}
	slog.Info("updated last recreated hot event", logger.Extra(map[string]any{
		"event": event,
	}))

	if err = a.workerTransactionRepo.CommitTx(ctx, tx); err != nil {
		slog.Error("failed to commit transaction", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}
}
