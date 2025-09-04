package worker

import "identity-rbac/config"

type AutoEventCreateWorker struct {
	cnf               config.Config
	eventRepo         EventRepo
	eventSettingsRepo EventSettingsRepo
}

func NewAutoEventCreateWorker(cnf config.Config, eventRepo EventRepo, eventSettigsRepo EventSettingsRepo) AutoEventCreateWorkerService {
	return AutoEventCreateWorker{
		cnf:               cnf,
		eventRepo:         eventRepo,
		eventSettingsRepo: eventSettigsRepo,
	}
}
