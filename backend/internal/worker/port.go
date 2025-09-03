package worker

type EventRepo interface {
	GetAutoCreateEvents()
	CreateAutoCreateEvnt()
}

type AutoEventCreateWorkerService interface {
}

type EventSettingsRepo interface {
	GetRunningEventIds()
}

type AutoEventCreateLogsRepo interface {
	
}
