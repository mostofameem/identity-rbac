package enum

type RecurrenceType string

const (
	RecurrenceDaily   RecurrenceType = "DAILY"
	RecurrenceWeekly  RecurrenceType = "WEEKLY"
	RecurrenceMonthly RecurrenceType = "MONTHLY"
	RecurrenceYearly  RecurrenceType = "YEARLY"
	RecurrenceOnce    RecurrenceType = "ONCE"
)

func (r RecurrenceType) IsValid() bool {
	switch r {
	case RecurrenceDaily, RecurrenceWeekly, RecurrenceMonthly, RecurrenceYearly, RecurrenceOnce:
		return true
	}
	return false
}
