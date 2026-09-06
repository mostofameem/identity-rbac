# Hot Events Refactor Plan

> Status: **Implemented** · Sep 2026 · Replaced the `hot_events` implementation with `event_occurrences` + recurrence (migrations 000014/000015)

## 1. Problem with the current implementation

| # | Issue | Where |
|---|---|---|
| 1 | `auto_event_interval_in_minutes` is stored but **never read** — after `auto_create_at` passes, the event is cloned **every worker tick** | `internal/worker/auto_create_event.go:133-156` |
| 2 | Clone insert runs on `r.db`, **outside the transaction** — crash between insert and `last_recreated_at` update produces duplicates | `internal/repo/event_repo.go:444` |
| 3 | Toggling hot state syncs two tables (`events.should_auto_create_event` + `hot_events`) across 4 code paths — drift-prone | `internal/event/event.go` |
| 4 | Nil-check *after* dereference in `UpdateShouldAutoCreateEventStatus` | `internal/event/event.go:319-323` |
| 5 | `GetEventTypeSettings` panics when `auto_create_at IS NULL` (nullable column, unconditional deref) | `internal/event/event_type_settings.go:43` |
| 6 | `CreateEvent` mixes tx boundaries (event insert outside tx, hot-row insert inside) | `internal/event/event.go:40-60` |
| 7 | Worker's `cache` dependency is injected but unused; clone hardcodes `created_by = 1` | `auto_create_event.go:20`, `event_repo.go:431` |

## 2. Design principles of the new solution

1. **One source of truth for membership**: `events.should_auto_create_event`. No registry table mirrors it.
2. **Worker-owned occurrence log**: an append-only table records *when each occurrence was materialized*. The API layer never writes it; the worker is the sole writer.
3. **Fixed cadence per event type** — `DAILY | WEEKLY | MONTHLY | YEARLY | ONCE`. The next occurrence is due exactly **one cadence step after the previous one** (daily → 1 day later, weekly → 1 week later, monthly → 1 month later, yearly → 1 year later, once → a single creation, then never).
4. **Anchored, not rolling**: occurrence dates are generated from the template's `start_at` anchor (`anchor, anchor+1step, anchor+2step, …`), so worker delay never accumulates drift — a Monday-10:00 weekly event is always created for a Monday.
5. **Idempotency at the DB level**: a unique constraint on `(event_id, scheduled_date)` makes a duplicate occurrence *impossible*, even across crashes.

## 3. Schema changes

### 3.1 New table — `event_occurrences` (replaces `hot_events`)

```sql
-- +migrate Up
CREATE TABLE event_occurrences (
    id             BIGSERIAL PRIMARY KEY,
    event_id       BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    scheduled_date DATE   NOT NULL,             -- the calendar slot this occurrence fills
    start_at       TIMESTAMP NOT NULL,          -- actual start_at written on the clone
    performed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    performed_by   BIGINT NOT NULL DEFAULT 1,   -- system user
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_occurrence_slot UNIQUE (event_id, scheduled_date)
);

CREATE INDEX idx_event_occurrences_event_id ON event_occurrences (event_id);

-- Backfill: port over "last recreated" so existing hot events don't re-clone
INSERT INTO event_occurrences (event_id, scheduled_date, start_at, performed_at)
SELECT he.event_id, he.last_recreated_at::date, he.last_recreated_at, he.last_recreated_at
FROM hot_events he
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS hot_events;
```

### 3.2 `event_type_settings` — cadence replaces interval

```sql
-- +migrate Up
ALTER TABLE event_type_settings
    ADD COLUMN recurrence VARCHAR(16) NOT NULL DEFAULT 'DAILY';
-- backfill from old interval if sensible (1440 min => DAILY), then:
ALTER TABLE event_type_settings
    DROP COLUMN IF EXISTS auto_event_interval_in_minutes;
```

- `auto_create_at TIME` **stays** — it is the daily time gate ("not before 09:00").
- New Go enum `internal/enum/recurrence.go`: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`, `ONCE`.

### 3.3 `events` — support index for the worker scan

```sql
CREATE INDEX idx_events_auto_create_scan
    ON events (id)
    WHERE should_auto_create_event = true AND is_active = true AND is_deleted = false;
```

## 4. Scheduling model

### 4.1 Definitions

- **Template**: the flagged event (`should_auto_create_event = true`). It is occurrence #0 and is never modified.
- **Anchor**: `template.start_at` (date + time-of-day).
- **Occurrence slots**: `anchor`, `anchor+1·step`, `anchor+2·step`, … where `step` comes from the type's `recurrence`.
- **`last_done`**: `MAX(scheduled_date)` from `event_occurrences` for the template; if no row exists, `last_done = anchor date` (the template itself occupies slot #0).
- **Gate**: `auto_create_at` (optional) — the earliest time-of-day on the due date the worker may act.

### 4.2 Due-date rule

```
candidate = smallest slot date d such that  d > last_done  AND  d >= today
if no candidate exists            -> skip (nothing due; also the terminal state for ONCE)
if candidate > today              -> skip (future slot, not due yet)
if gate set AND now < today@gate  -> skip (too early in the day)
otherwise                         -> due: create occurrence for `candidate` (= today)
```

Properties that fall out of this rule:

- **At most one creation per template per day**, enforced by `UNIQUE (event_id, scheduled_date)`.
- **No backfilling**: if the worker was down on the scheduled day, missed slots are skipped — the next *future-or-today* slot is used (a weekly Monday template that misses Monday waits for next Monday; a daily template down for 3 days simply resumes today).
- **No drift**: slots are anchored to the template, not to whenever the worker happened to run.
- **ONCE**: after one log row exists, no `candidate` is ever due again (terminal). Its single creation is due at the first gate after the flag is turned on — "set it once, the system creates tomorrow's event, then stops."

### 4.3 Cadence steps & edge cases

| Cadence | Step | Notes |
|---|---|---|
| `DAILY` | `+1 day` | every calendar day is a slot |
| `WEEKLY` | `+7 days` | preserves weekday of the anchor |
| `MONTHLY` | `+1 month` | **clamp day-of-month** (anchor Jan 31 → Feb slot is Feb 28/29, not Mar 3). Compute with a `addMonthsClamped` helper, *not* naive `time.AddDate` |
| `YEARLY` | `+1 year` | leap-day anchors (Feb 29) clamp to Feb 28 in non-leap years |
| `ONCE` | — | single creation, then terminal (see 4.2) |

Timezone: slot dates and gate times are evaluated in **server-local time** (matches current behaviour). Recommended follow-up: make the deployment timezone explicit via config; occurrences are dates, not instants, so DST transitions only shift the effective gate by an hour at most.

## 5. Worker algorithm

Replaces `doAutoEventCreation` / `createNewEvent` in `internal/worker/auto_create_event.go`.

```go
for each tick (EVENT_AUTO_CREATE_WORKER_DELAY_IN_MINUTE):
  templates := SELECT e.*, ets.recurrence, ets.auto_create_at, last_done
               FROM events e
               JOIN event_type_settings ets ON ets.event_type_id = e.event_type_id
                    AND ets.is_active
               LEFT JOIN LATERAL (
                    SELECT MAX(scheduled_date) AS last_done
                    FROM event_occurrences o WHERE o.event_id = e.id
               ) o ON true
               WHERE e.should_auto_create_event AND e.is_active AND NOT e.is_deleted

  for each template:
      candidate, ok := nextSlot(anchor=e.start_at, step=cadenceStep(recurrence),
                                lastDone=lastDone-or-anchorDate, today)
      if !ok || candidate.After(today)            { continue }
      if gate != nil && now.Before(gateOn(candidate)) { continue }

      tx := Begin()
      claimed := INSERT INTO event_occurrences (event_id, scheduled_date, start_at)
                 VALUES (e.id, candidate, candidateAtAnchorTime)
                 ON CONFLICT (event_id, scheduled_date) DO NOTHING
      if claimed == 0 { Rollback; continue }        // someone else got the slot

      clone := e with:
          startAt               = candidate @ anchor time-of-day
          registrationOpensAt   = startAt - (e.startAt - e.registrationOpensAt)   // offsets preserved
          registrationClosesAt  = startAt - (e.startAt - e.registrationClosesAt)
          shouldAutoCreateEvent = false   // a clone is never a template
          createdBy/updatedBy   = SYSTEM_USER_ID
          remarks               = "System created event"
      INSERT clone (inside the SAME tx)             // fixes issue #2
      Commit
```

Key differences from today:

- The claim (`event_occurrences` insert) is the **first statement in the tx** — the unique constraint is the idempotency guard, not the timestamp update.
- Clone insert and claim commit or roll back **together**.
- Drop the unused `cache` dependency (issue #7).
- Errors per-template are logged and skipped; one bad template never aborts the tick.

## 6. Service / API layer changes

All in `internal/event/`:

| Method | Before | After |
|---|---|---|
| `CreateEvent` | limit check via `hot_events` count + `CreateHotEvent` in tx | plain insert; limit check becomes `COUNT(*) WHERE should_auto_create_event AND is_active` (fixes #6, #3) |
| `UpdateEventStatus` | delete/recreate hot rows on deactivate/reactivate | single `UPDATE is_active` — the worker scan already filters on it |
| `UpdateShouldAutoCreateEventStatus` | two-table sync | single `UPDATE should_auto_create_event` (+ limit check when turning ON); nil-check bug disappears with the simpler body (fixes #4) |
| `EventTypeSettings` | interval in minutes | `recurrence` enum; `GetEventTypeSettings` must nil-guard `auto_create_at` (fixes #5) |

New read endpoint (optional, cheap): `GET /api/v1/events/{id}/occurrences` — returns the log rows + computed next due date. Powers a "next scheduled" badge in the UI and makes worker behaviour observable.

Deleted code: `internal/repo/hot_events_repo.go`, the `HotEventsRepo` ports in `internal/worker/port.go` and `internal/event/port.go`, `entity/hot_events.go`.

Config: `MAX_HOT_EVENT_LIMIT` stays (semantics unchanged, now counted on `events`). Add `SYSTEM_USER_ID` (replaces hardcoded `1`).

## 7. Frontend changes

- `EventTypeSettings.tsx`: replace the hardcoded `autoEventIntervalInMinutes: 1440` with a **Recurrence** select (`Daily / Weekly / Monthly / Yearly / Once`). Keep the `autoCreateAt` time picker (relabeled "Create no earlier than").
- `EventForm.tsx` / `EventList.tsx`: the `shouldAutoCreateEvent` toggle is unchanged — but the helper text can now say "Repeats weekly" by reading the type's recurrence.
- Optional: show *last performed / next due* from the new occurrences endpoint.

## 8. Migration & rollout

1. **Phase 1 — additive**: migration 000014 adds `event_occurrences`, `recurrence` column, indexes; backfills from `hot_events`; keeps `hot_events` in place. Deploy. (Old worker still runs against `hot_events`; no behaviour change.)
2. **Phase 2 — cutover**: ship the new worker + service/repo/frontend changes behind the new queries. `event_occurrences` is already backfilled, so no double-creation. Deploy together (worker + API + UI).
3. **Phase 3 — cleanup**: migration 000015 drops `hot_events` and `auto_event_interval_in_minutes`; delete dead code (`hot_events_repo.go`, ports, entity).

Rollback: Phase 2 is revertable as a unit — the old worker reads `hot_events`, which is untouched until Phase 3 (the backfilled `last_recreated_at` values remain valid because the new worker only appends to `event_occurrences`).

## 9. Test plan

**Delivered:**

- **Unit — scheduling** (`util/recurrence_schedule_test.go`): every cadence; month-end clamping (Jan 31 → Feb 28, non-compounding); leap years (Feb 29 → Feb 28); missed-days resume (no backfill); ONCE terminal state; future anchor; unknown recurrence.
- **Unit — gate** (`util/recurrence_schedule_test.go::TestGateIsOpen`): before/at/after boundaries; `HH:MM` and `HH:MM:SS` forms; fractional seconds; garbage and empty values fail closed.
- **Unit — worker** (`worker/auto_create_event_test.go`, hand-rolled fakes): claim-loses-race skips the clone and rolls back; clone fields (anchor time-of-day, registration offsets preserved, `"System created event"` remarks, `SYSTEM_USER_ID` on both the claim's `performed_by` and the clone's audit columns); per-template error isolation (one failing template does not abort the tick); gate fail-closed on unparseable values; nil gate creates immediately.

**Outstanding (needs a live Postgres harness, none exists in this repo):**

- **Integration**: full tick against seeded data; duplicate-run safety (run tick twice → identical state); crash simulation (kill between claim and clone → rollback leaves no partial state); migration 000014 backfill behavior on real `hot_events` data.

- **Manual**: flag an event weekly, verify created Monday@anchor-time with correct registration windows and exactly one row in `event_occurrences`.

## 10. Traceability — issues → resolution

| Issue | Resolved by |
|---|---|
| #1 interval never checked / clone every tick | cadence slots + `UNIQUE (event_id, scheduled_date)` (§4, §3.1) |
| #2 clone insert outside tx | claim-first single transaction (§5) |
| #3 two-table toggle sync | flag is the only source of truth (§2.1, §6) |
| #4 nil-check after deref | method body simplified away (§6) |
| #5 settings nil deref | nil-guard in `GetEventTypeSettings` (§6) |
| #6 mixed tx in `CreateEvent` | API no longer writes tracking data (§6) |
| #7 unused cache / `created_by=1` | dependency dropped; `SYSTEM_USER_ID` config (§5, §6) |

## 11. Open decisions

1. **ONCE semantics** — proposed: one creation at the first gate after flag-on, then terminal. Alternative: an explicit `next_run_at` on settings for "create exactly once at a chosen future date". Default proposal needs no extra column.
2. **Timezone** — server-local for now (status quo); consider a `TIMEZONE` config later so slot dates are unambiguous.
3. **Deactivated templates with history** — when a flag is turned off and later back on, `last_done` persists, so no burst of catch-up creations. Confirm this is desired (it is the safe default).
4. **`event_occurrences` growth** — one row per template per cadence step; daily events add ~365 rows/year/template. Negligible, but a retention job can prune rows older than N months if history isn't needed for audit.
