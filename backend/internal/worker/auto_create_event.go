package worker

import (
	"context"
	"identity-rbac/config"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"
)

type autoEventCreateWorker struct {
	cnf             *config.Config
	eventRepo       EventRepo
	occurrenceRepo  OccurrenceRepo
	transactionRepo WorkerTransactionRepo
}

func NewAutoEventCreateWorker(
	cnf *config.Config,
	eventRepo EventRepo,
	occurrenceRepo OccurrenceRepo,
	transactionRepo WorkerTransactionRepo) AutoEventCreateWorkerService {
	return &autoEventCreateWorker{
		cnf:             cnf,
		eventRepo:       eventRepo,
		occurrenceRepo:  occurrenceRepo,
		transactionRepo: transactionRepo,
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

// doAutoEventCreation scans every event flagged should_auto_create_event and
// materializes the occurrences that are due today. Occurrence slots are
// anchored to each template's start_at and stepped by the event type's
// recurrence (daily -> 1 day, weekly -> 1 week, monthly -> 1 month,
// yearly -> 1 year, once -> a single creation). Each tick is idempotent:
// the UNIQUE (event_id, scheduled_date) constraint on event_occurrences
// guarantees at most one clone per template per calendar slot, even across
// crashes or concurrent workers.
func (a *autoEventCreateWorker) doAutoEventCreation(ctx context.Context) {
	templates, err := a.eventRepo.GetAutoCreateEventTemplates(ctx)
	if err != nil {
		slog.Error("failed to fetch auto create event templates", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return
	}

	if len(templates) == 0 {
		return
	}

	slog.Info("fetched auto create event templates", logger.Extra(map[string]any{
		"total_templates": len(templates),
	}))

	now := time.Now()
	for _, template := range templates {
		a.processTemplate(ctx, template, now)
	}
}

func (a *autoEventCreateWorker) processTemplate(ctx context.Context, template entity.AutoCreateEventTemplate, now time.Time) {
	slot, ok := util.NextOccurrenceDate(
		template.StartAt,
		template.LastDone,
		template.HasOccurrence,
		enum.RecurrenceType(template.Recurrence),
		now,
	)
	if !ok {
		return
	}

	// Respect the daily gate: not before event_type_settings.auto_create_at.
	// An unparseable gate fails closed — the template is skipped rather than
	// created ungated.
	if template.AutoCreateAt != nil {
		open, err := util.GateIsOpen(*template.AutoCreateAt, now)
		if err != nil {
			slog.Warn("invalid auto_create_at, skipping template this tick", logger.Extra(map[string]any{
				"event_id":       template.Id,
				"auto_create_at": *template.AutoCreateAt,
				"error":          err.Error(),
			}))
			return
		}
		if !open {
			return
		}
	}

	startAt := util.OccurrenceStartAt(slot, template.StartAt)

	// Preserve the original gaps between StartAt and the registration dates.
	registrationOpensAtDiff := template.StartAt.Sub(template.RegistrationOpensAt)
	registrationClosesAtDiff := template.StartAt.Sub(template.RegistrationClosesAt)

	clone := entity.Events{
		Title:                template.Title,
		Description:          template.Description,
		EventTypeId:          template.EventTypeId,
		StartAt:              startAt,
		RegistrationOpensAt:  startAt.Add(-registrationOpensAtDiff),
		RegistrationClosesAt: startAt.Add(-registrationClosesAtDiff),
		MaxParticipants:      template.MaxParticipants,
		Remarks:              util.Ptr(autoEventRemarks),
	}

	a.createOccurrence(ctx, template.Id, slot, startAt, clone)
}

// createOccurrence claims the slot and inserts the clone in one transaction.
// The claim runs first with ON CONFLICT DO NOTHING: if this call did not win
// the slot (already created earlier today, or a concurrent worker), nothing
// is written. The clone insert shares the transaction, so a crash can never
// leave a claim without its clone or a clone without its claim.
func (a *autoEventCreateWorker) createOccurrence(ctx context.Context, eventID int, slot, startAt time.Time, clone entity.Events) {
	tx, err := a.transactionRepo.BeginTx(ctx)
	if err != nil {
		slog.Error("failed to begin transaction", logger.Extra(map[string]any{
			"event_id": eventID,
			"error":    err.Error(),
		}))
		return
	}
	committed := false
	defer func() {
		if !committed {
			a.transactionRepo.RollbackTx(ctx, tx)
		}
	}()

	claimed, err := a.occurrenceRepo.ClaimOccurrence(ctx, tx, entity.EventOccurrence{
		EventId:       eventID,
		ScheduledDate: slot,
		StartAt:       startAt,
		PerformedBy:   a.cnf.SystemUserID,
	})
	if err != nil {
		return
	}
	if !claimed {
		return
	}

	if err := a.eventRepo.CreateEventInTx(ctx, tx, clone, a.cnf.SystemUserID); err != nil {
		return
	}
	slog.Info("created new event", logger.Extra(map[string]any{
		"event_id":       eventID,
		"scheduled_date": slot,
		"start_at":       startAt,
	}))

	if err := a.transactionRepo.CommitTx(ctx, tx); err != nil {
		slog.Error("failed to commit transaction", logger.Extra(map[string]any{
			"event_id": eventID,
			"error":    err.Error(),
		}))
		return
	}
	committed = true
}
