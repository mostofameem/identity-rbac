package enum

type PerticepateStatusType string

const (
	PerticepateStatusGoing    PerticepateStatusType = "GOING"
	PerticepateStatusNotGoing PerticepateStatusType = "NOT_GOING"
	PerticepateStatusMaybe    PerticepateStatusType = "MAYBE"
)
