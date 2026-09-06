package util

import (
	"strings"
	"time"

	"identity-rbac/internal/enum"
)

// maxSlotIterations bounds the slot scan so corrupt data (e.g. an anchor
// decades in the past with a daily recurrence) can never spin forever.
const maxSlotIterations = 100000

// NextOccurrenceDate returns the next occurrence slot that is due today.
//
// Occurrence slots are anchored to the template's start_at:
// anchor, anchor+1*step, anchor+2*step, ... so worker delay never
// accumulates drift. A slot is due when it is the first slot after the last
// performed one AND it falls on today. Slots that were missed entirely
// (worker downtime) are skipped, never backfilled.
//
// For ONCE recurrence the single creation is due today as long as no
// occurrence exists yet; afterwards the schedule is terminal.
func NextOccurrenceDate(anchor, lastDone time.Time, hasOccurrence bool, recurrence enum.RecurrenceType, today time.Time) (time.Time, bool) {
	todayDate := dateOf(today)
	lastDoneDate := dateOf(lastDone)

	switch recurrence {
	case enum.RecurrenceOnce:
		if hasOccurrence {
			return time.Time{}, false
		}
		return todayDate, true
	case enum.RecurrenceDaily, enum.RecurrenceWeekly, enum.RecurrenceMonthly, enum.RecurrenceYearly:
		anchorDate := dateOf(anchor)
		for n := 1; n <= maxSlotIterations; n++ {
			slot := slotDate(anchorDate, n, recurrence)
			if !slot.After(lastDoneDate) {
				continue // slot already covered by an occurrence (slot 0 is the template itself)
			}
			if slot.Before(todayDate) {
				continue // missed slot — never backfill
			}
			if slot.After(todayDate) {
				return time.Time{}, false // next slot is in the future
			}
			return slot, true
		}
	}
	return time.Time{}, false
}

// OccurrenceStartAt recombines a slot date with the anchor's time-of-day.
func OccurrenceStartAt(slot, anchor time.Time) time.Time {
	return time.Date(slot.Year(), slot.Month(), slot.Day(),
		anchor.Hour(), anchor.Minute(), anchor.Second(), 0, time.Local)
}

// GateIsOpen reports whether `now` is at or past the daily gate time.
// It accepts "HH:MM" or "HH:MM:SS" (fractional seconds are ignored, since a
// Postgres TIME column can return them). An unparseable gate is an error —
// callers must fail closed (skip the template), never create ungated.
func GateIsOpen(gate string, now time.Time) (bool, error) {
	trimmed := strings.SplitN(gate, ".", 2)[0]

	g, err := time.Parse("15:04:05", trimmed)
	if err != nil {
		g, err = time.Parse("15:04", trimmed)
		if err != nil {
			return false, err
		}
	}

	gateToday := time.Date(now.Year(), now.Month(), now.Day(),
		g.Hour(), g.Minute(), g.Second(), 0, now.Location())

	return !now.Before(gateToday), nil
}

func slotDate(anchorDate time.Time, n int, recurrence enum.RecurrenceType) time.Time {
	switch recurrence {
	case enum.RecurrenceDaily:
		return anchorDate.AddDate(0, 0, n)
	case enum.RecurrenceWeekly:
		return anchorDate.AddDate(0, 0, 7*n)
	case enum.RecurrenceMonthly:
		return AddMonthsClamped(anchorDate, n)
	case enum.RecurrenceYearly:
		return AddMonthsClamped(anchorDate, 12*n)
	}
	return anchorDate
}

// AddMonthsClamped adds months to a date, clamping the day-of-month to the
// target month's last day (Jan 31 + 1 month = Feb 28/29, not Mar 2/3).
// The time-of-day is preserved.
func AddMonthsClamped(t time.Time, months int) time.Time {
	total := int(t.Month()) - 1 + months
	year := t.Year() + total/12
	month := time.Month(total%12 + 1)
	day := t.Day()
	if last := DaysInMonth(year, month); day > last {
		day = last
	}
	return time.Date(year, month, day, t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), t.Location())
}

// DaysInMonth returns the number of days in the given month.
func DaysInMonth(year int, month time.Month) int {
	return time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
}

func dateOf(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local)
}
