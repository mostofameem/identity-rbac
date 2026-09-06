package util

import (
	"testing"
	"time"

	"identity-rbac/internal/enum"
)

func dt(year int, month time.Month, day int) time.Time {
	return time.Date(year, month, day, 10, 30, 0, 0, time.Local)
}

// day is a slot date: midnight, since slots are calendar days.
func day(year int, month time.Month, day int) time.Time {
	return time.Date(year, month, day, 0, 0, 0, 0, time.Local)
}

func TestNextOccurrenceDate(t *testing.T) {
	tests := []struct {
		name          string
		recurrence    enum.RecurrenceType
		anchor        time.Time
		lastDone      time.Time
		hasOccurrence bool
		today         time.Time
		wantDue       bool
		wantSlot      time.Time
	}{
		{
			name:       "daily: due three days after anchor with no occurrences",
			recurrence: enum.RecurrenceDaily,
			anchor:     dt(2026, time.September, 1),
			lastDone:   dt(2026, time.September, 1), // template occupies slot 0
			today:      dt(2026, time.September, 4),
			wantDue:    true,
			wantSlot:   day(2026, time.September, 4),
		},
		{
			name:          "daily: already performed today is not due again",
			recurrence:    enum.RecurrenceDaily,
			anchor:        dt(2026, time.September, 1),
			lastDone:      dt(2026, time.September, 4),
			hasOccurrence: true,
			today:         dt(2026, time.September, 4),
			wantDue:       false,
		},
		{
			name:       "daily: missed days are skipped, resumes today",
			recurrence: enum.RecurrenceDaily,
			anchor:     dt(2026, time.August, 25),
			lastDone:   dt(2026, time.August, 28),
			today:      dt(2026, time.September, 6),
			wantDue:    true,
			wantSlot:   day(2026, time.September, 6),
		},
		{
			name:       "weekly: due on the anchored weekday one week later",
			recurrence: enum.RecurrenceWeekly,
			anchor:     dt(2026, time.August, 31), // a Monday
			lastDone:   dt(2026, time.August, 31),
			today:      dt(2026, time.September, 7), // next Monday
			wantDue:    true,
			wantSlot:   day(2026, time.September, 7),
		},
		{
			name:       "weekly: missed Monday is not backfilled mid-week",
			recurrence: enum.RecurrenceWeekly,
			anchor:     dt(2026, time.August, 31), // Monday
			lastDone:   dt(2026, time.August, 31),
			today:      dt(2026, time.September, 3), // Thursday, Monday was missed
			wantDue:    false,
		},
		{
			name:       "monthly: day-of-month clamps at month end (Jan 31 -> Feb 28)",
			recurrence: enum.RecurrenceMonthly,
			anchor:     dt(2026, time.January, 31),
			lastDone:   dt(2026, time.January, 31),
			today:      dt(2026, time.February, 28),
			wantDue:    true,
			wantSlot:   day(2026, time.February, 28),
		},
		{
			name:       "monthly: clamping does not compound (Jan 31 -> Mar 31, not Mar 28)",
			recurrence: enum.RecurrenceMonthly,
			anchor:     dt(2026, time.January, 31),
			lastDone:   dt(2026, time.February, 28),
			today:      dt(2026, time.March, 31),
			wantDue:    true,
			wantSlot:   day(2026, time.March, 31),
		},
		{
			name:       "yearly: leap-day anchor clamps to Feb 28 in a non-leap year",
			recurrence: enum.RecurrenceYearly,
			anchor:     dt(2024, time.February, 29),
			lastDone:   dt(2024, time.February, 29),
			today:      dt(2025, time.February, 28),
			wantDue:    true,
			wantSlot:   day(2025, time.February, 28),
		},
		{
			name:       "once: due today while no occurrence exists",
			recurrence: enum.RecurrenceOnce,
			anchor:     dt(2026, time.September, 1),
			lastDone:   dt(2026, time.September, 1),
			today:      dt(2026, time.September, 6),
			wantDue:    true,
			wantSlot:   day(2026, time.September, 6),
		},
		{
			name:          "once: terminal after the single occurrence",
			recurrence:    enum.RecurrenceOnce,
			anchor:        dt(2026, time.September, 1),
			lastDone:      dt(2026, time.September, 2),
			hasOccurrence: true,
			today:         dt(2026, time.September, 6),
			wantDue:       false,
		},
		{
			name:       "future anchor is not due yet",
			recurrence: enum.RecurrenceDaily,
			anchor:     dt(2026, time.September, 8),
			lastDone:   dt(2026, time.September, 8),
			today:      dt(2026, time.September, 6),
			wantDue:    false,
		},
		{
			name:       "unknown recurrence is never due",
			recurrence: enum.RecurrenceType("FORTNIGHTLY"),
			anchor:     dt(2026, time.September, 1),
			lastDone:   dt(2026, time.September, 1),
			today:      dt(2026, time.September, 6),
			wantDue:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotSlot, gotDue := NextOccurrenceDate(tt.anchor, tt.lastDone, tt.hasOccurrence, tt.recurrence, tt.today)
			if gotDue != tt.wantDue {
				t.Fatalf("due = %v, want %v", gotDue, tt.wantDue)
			}
			if tt.wantDue && !gotSlot.Equal(tt.wantSlot) {
				t.Fatalf("slot = %v, want %v", gotSlot, tt.wantSlot)
			}
		})
	}
}

func TestGateIsOpen(t *testing.T) {
	now := time.Date(2026, time.September, 6, 9, 0, 0, 0, time.Local)

	tests := []struct {
		name    string
		gate    string
		at      time.Time
		want    bool
		wantErr bool
	}{
		{"before gate is closed", "10:00:00", now, false, false},
		{"exactly at gate is open", "09:00:00", now, true, false},
		{"after gate is open", "08:00:00", now, true, false},
		{"HH:MM form parses", "08:30", now, true, false},
		{"fractional seconds are ignored", "09:00:00.123456", now, true, false},
		{"fractional HH:MM:SS boundary", "09:00:30.5", now, false, false},
		{"garbage fails closed", "whenever", now, false, true},
		{"empty fails closed", "", now, false, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GateIsOpen(tt.gate, tt.at)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error for gate %q, got open=%v", tt.gate, got)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error for gate %q: %v", tt.gate, err)
			}
			if got != tt.want {
				t.Fatalf("GateIsOpen(%q, %v) = %v, want %v", tt.gate, tt.at, got, tt.want)
			}
		})
	}
}

func TestOccurrenceStartAt(t *testing.T) {
	anchor := time.Date(2026, time.September, 1, 14, 45, 10, 0, time.Local)
	slot := time.Date(2026, time.September, 8, 0, 0, 0, 0, time.Local)

	got := OccurrenceStartAt(slot, anchor)
	want := time.Date(2026, time.September, 8, 14, 45, 10, 0, time.Local)
	if !got.Equal(want) {
		t.Fatalf("OccurrenceStartAt = %v, want %v", got, want)
	}
}

func TestAddMonthsClamped(t *testing.T) {
	tests := []struct {
		name   string
		input  time.Time
		months int
		want   time.Time
	}{
		{"Jan 31 + 1 month", dt(2026, time.January, 31), 1, dt(2026, time.February, 28)},
		{"Jan 31 + 13 months", dt(2026, time.January, 31), 13, dt(2027, time.February, 28)},
		{"Mar 15 + 1 month", dt(2026, time.March, 15), 1, dt(2026, time.April, 15)},
		{"Oct 31 + 1 month", dt(2026, time.October, 31), 1, dt(2026, time.November, 30)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := AddMonthsClamped(tt.input, tt.months)
			if !got.Equal(tt.want) {
				t.Fatalf("AddMonthsClamped = %v, want %v", got, tt.want)
			}
		})
	}
}
