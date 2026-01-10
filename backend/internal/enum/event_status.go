package enum

type EventStatusType string

const (
	EventStatusOngoing  EventStatusType = "ONGOING"
	EventStatusUpcoming EventStatusType = "UPCOMING"
	EventStatusRecent   EventStatusType = "RECENT"
)
