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

	var eventIds, eventTypeIds []int
	for _, hotEvent := range hotevents {
		eventIds = append(eventIds, hotEvent.EventID)
		eventTypeIds = append(eventTypeIds, hotEvent.EventTypeID)
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
		event, ok := mapEvents[hotEvent.EventID]
		if !ok {
			continue
		}

		settings, ok := mapEventTypeSettings[hotEvent.EventTypeID]
		if !ok {
			continue
		}

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

		// Check if current_time - hot_event.last_recreated_hot_event >= event_settings.auto_event_interval_in_minutes
		interval := time.Minute * time.Duration(settings.AutoEventIntervalInMinutes)
		if !hotEvent.LastRecreatedAt.IsZero() && now.Sub(hotEvent.LastRecreatedAt) < interval {
			continue
		}

		// Create a new event with new timings.
		// Note: We use the interval to shift the dates from the original event.
		event.StartAt = event.StartAt.Add(interval)
		event.RegistrationOpensAt = event.RegistrationOpensAt.Add(interval)
		event.RegistrationClosesAt = event.RegistrationClosesAt.Add(interval)
		event.Remarks = util.Ptr(autoEventRemarks)
		a.createNewEvent(ctx, event)
	}
}
func (a *autoEventCreateWorker) createNewEvent(ctx context.Context, event entity.Events) {
	a.eventRepo.AutoCreateEvent(ctx, event)
	a.hotEventsRepo.UpdateLastRecreatedHotEvent(ctx, nil, event.Id, event.EventTypeId)
}
