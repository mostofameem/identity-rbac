package event

import (
	"context"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/util"
)

// GetEventOccurrences returns the worker's occurrence log for an event plus
// the next slot the scheduler will materialize, so UIs can observe what the
// auto-create worker is doing with a hot event.
func (s *service) GetEventOccurrences(ctx context.Context, id int) (EventOccurrencesResponse, error) {
	event, err := s.eventRepo.GetByID(ctx, nil, id)
	if err != nil {
		return EventOccurrencesResponse{}, util.ErrSomethingWentWrong
	}
	if event == nil {
		return EventOccurrencesResponse{}, util.ErrNotFound
	}

	occurrences, err := s.occurrenceRepo.GetOccurrences(ctx, id)
	if err != nil {
		return EventOccurrencesResponse{}, util.ErrSomethingWentWrong
	}

	response := EventOccurrencesResponse{
		Occurrences: make([]EventOccurrenceDto, len(occurrences)),
	}

	// The next due slot only exists for events whose type has settings.
	if settings, err := s.eventTypeSettingRepo.GetByEventTypeID(ctx, event.EventTypeId); err == nil && settings != nil {
		response.Recurrence = settings.Recurrence

		lastDone := event.StartAt
		hasOccurrence := len(occurrences) > 0
		if hasOccurrence {
			lastDone = occurrences[0].ScheduledDate // ordered by scheduled_date DESC
		}
		if slot, ok := util.NextOccurrenceDate(
			event.StartAt, lastDone, hasOccurrence,
			enum.RecurrenceType(settings.Recurrence), util.GetCurrentTime(),
		); ok {
			nextDueAt := util.OccurrenceStartAt(slot, event.StartAt)
			response.NextDueDate = &nextDueAt
		}
	}

	for i, occurrence := range occurrences {
		response.Occurrences[i] = EventOccurrenceDto{
			ScheduledDate: occurrence.ScheduledDate,
			StartAt:       occurrence.StartAt,
			PerformedAt:   occurrence.PerformedAt,
		}
	}

	return response, nil
}
