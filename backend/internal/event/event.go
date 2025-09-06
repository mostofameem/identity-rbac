package event

import "identity-rbac/config"

type service struct {
	cnf              *config.Config
	eventRepo        EventRepo
	eventTypeRepo    EventTypeRepo
	perticipantRepo  PerticipantRepo
	eventSettingRepo EventSettingRepo
}

func NewEventSerVice(cnf *config.Config, eventRepo EventRepo, eventTypeRepo EventTypeRepo, perticipantRepo PerticipantRepo, eventSettingRepo EventSettingRepo) Service {
	return &service{
		cnf:              cnf,
		eventRepo:        eventRepo,
		eventTypeRepo:    eventTypeRepo,
		perticipantRepo:  perticipantRepo,
		eventSettingRepo: eventSettingRepo,
	}
}
