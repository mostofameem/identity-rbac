package event

import "identity-rbac/config"

type service struct {
	cnf                  *config.Config
	eventRepo            EventRepo
	eventTypeRepo        EventTypeRepo
	eventTypeSettingRepo EventTypeSettingRepo
	participantRepo      ParticipantRepo
	eventSettingRepo     EventTypeSettingRepo
	transactionRepo      TransactionRepo
	hotEventsRepo        HotEventsRepo
}

func NewEventSerVice(
	cnf *config.Config,
	eventRepo EventRepo,
	eventTypeRepo EventTypeRepo,
	eventTypeSettingRepo EventTypeSettingRepo,
	participantRepo ParticipantRepo,
	eventSettingRepo EventTypeSettingRepo,
	transactionRepo TransactionRepo,
	hotEventsRepo HotEventsRepo,
) Service {
	return &service{
		cnf:                  cnf,
		eventRepo:            eventRepo,
		eventTypeRepo:        eventTypeRepo,
		eventTypeSettingRepo: eventTypeSettingRepo,
		participantRepo:      participantRepo,
		eventSettingRepo:     eventSettingRepo,
		transactionRepo:      transactionRepo,
		hotEventsRepo:        hotEventsRepo,
	}
}
