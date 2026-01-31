package enum

type PublicEventStatusType string

const (
	PublicEventStatusOngoing  PublicEventStatusType = "ONGOING"
	PublicEventStatusUpcoming PublicEventStatusType = "UPCOMING"
	PublicEventStatusRecent   PublicEventStatusType = "RECENT"
)
