package event

import "identity-rbac/config"

type service struct {
	cnf                  *config.Config
	eventRepo            EventRepo
	eventTypeRepo        EventTypeRepo
	eventTypeSettingRepo EventTypeSettingRepo
	participantRepo      ParticipantRepo
	transactionRepo      TransactionRepo
	occurrenceRepo       OccurrenceRepo
}

func NewEventSerVice(
	cnf *config.Config,
	eventRepo EventRepo,
	eventTypeRepo EventTypeRepo,
	eventTypeSettingRepo EventTypeSettingRepo,
	participantRepo ParticipantRepo,
	transactionRepo TransactionRepo,
	occurrenceRepo OccurrenceRepo,
) Service {
	return &service{
		cnf:                  cnf,
		eventRepo:            eventRepo,
		eventTypeRepo:        eventTypeRepo,
		eventTypeSettingRepo: eventTypeSettingRepo,
		participantRepo:      participantRepo,
		transactionRepo:      transactionRepo,
		occurrenceRepo:       occurrenceRepo,
	}
}
