package worker

import (
	"context"
	"testing"
	"time"

	"identity-rbac/config"
	"identity-rbac/internal/entity"
	"identity-rbac/internal/enum"

	"github.com/jmoiron/sqlx"
)

// --- fakes -----------------------------------------------------------------

type fakeEventRepo struct {
	templates []entity.AutoCreateEventTemplate
	created   []entity.Events
	sysUsers  []int
	calls     int
	createErr error // when set, the errAt-th call fails (-1 = every call)
	errAt     int
}

func (f *fakeEventRepo) GetAutoCreateEventTemplates(ctx context.Context) ([]entity.AutoCreateEventTemplate, error) {
	return f.templates, nil
}

func (f *fakeEventRepo) CreateEventInTx(ctx context.Context, tx *sqlx.Tx, event entity.Events, systemUserID int) error {
	at := f.calls
	f.calls++
	if f.createErr != nil && (f.errAt < 0 || f.errAt == at) {
		return f.createErr
	}
	f.created = append(f.created, event)
	f.sysUsers = append(f.sysUsers, systemUserID)
	return nil
}

type fakeOccurrenceRepo struct {
	claims []entity.EventOccurrence
	win    bool
	err    error
}

func (f *fakeOccurrenceRepo) ClaimOccurrence(ctx context.Context, tx *sqlx.Tx, occurrence entity.EventOccurrence) (bool, error) {
	if f.err != nil {
		return false, f.err
	}
	f.claims = append(f.claims, occurrence)
	return f.win, nil
}

type fakeTxRepo struct {
	begins, commits, rollbacks int
}

func (f *fakeTxRepo) BeginTx(ctx context.Context) (*sqlx.Tx, error) {
	f.begins++
	return nil, nil
}

func (f *fakeTxRepo) CommitTx(ctx context.Context, tx *sqlx.Tx) error {
	f.commits++
	return nil
}

func (f *fakeTxRepo) RollbackTx(ctx context.Context, tx *sqlx.Tx) error {
	f.rollbacks++
	return nil
}

// --- helpers ---------------------------------------------------------------

const testSystemUserID = 7

func newTestWorker(eventRepo *fakeEventRepo, occRepo *fakeOccurrenceRepo, txRepo *fakeTxRepo) *autoEventCreateWorker {
	return &autoEventCreateWorker{
		cnf:             &config.Config{SystemUserID: testSystemUserID},
		eventRepo:       eventRepo,
		occurrenceRepo:  occRepo,
		transactionRepo: txRepo,
	}
}

// dueTodayTemplate returns a daily template anchored yesterday, so today's
// slot is due at `now` as long as no gate blocks it.
func dueTodayTemplate(now time.Time) entity.AutoCreateEventTemplate {
	anchor := now.AddDate(0, 0, -1)
	return entity.AutoCreateEventTemplate{
		Id:                   42,
		Title:                "Weekly Lunch",
		Description:          "food",
		EventTypeId:          3,
		StartAt:              anchor,
		RegistrationOpensAt:  anchor.Add(-2 * time.Hour),
		RegistrationClosesAt: anchor.Add(-1 * time.Hour),
		MaxParticipants:      10,
		Recurrence:           string(enum.RecurrenceDaily),
		LastDone:             anchor,
		HasOccurrence:        false,
	}
}

// --- tests -----------------------------------------------------------------

func TestDoAutoEventCreation_ClaimsSlotAndClonesEvent(t *testing.T) {
	now := time.Date(2026, time.September, 6, 12, 0, 0, 0, time.Local)
	template := dueTodayTemplate(now)

	eventRepo := &fakeEventRepo{templates: []entity.AutoCreateEventTemplate{template}}
	occRepo := &fakeOccurrenceRepo{win: true}
	txRepo := &fakeTxRepo{}
	worker := newTestWorker(eventRepo, occRepo, txRepo)

	worker.doAutoEventCreation(context.Background())

	if len(occRepo.claims) != 1 {
		t.Fatalf("claims = %d, want 1", len(occRepo.claims))
	}
	claim := occRepo.claims[0]
	if claim.EventId != template.Id {
		t.Errorf("claim.EventId = %d, want %d", claim.EventId, template.Id)
	}
	if claim.PerformedBy != testSystemUserID {
		t.Errorf("claim.PerformedBy = %d, want %d", claim.PerformedBy, testSystemUserID)
	}
	wantSlot := time.Date(2026, time.September, 6, 0, 0, 0, 0, time.Local)
	if !claim.ScheduledDate.Equal(wantSlot) {
		t.Errorf("claim.ScheduledDate = %v, want %v", claim.ScheduledDate, wantSlot)
	}

	if len(eventRepo.created) != 1 {
		t.Fatalf("created = %d, want 1", len(eventRepo.created))
	}
	clone := eventRepo.created[0]
	wantStart := time.Date(2026, time.September, 6,
		template.StartAt.Hour(), template.StartAt.Minute(), template.StartAt.Second(), 0, time.Local)
	if !clone.StartAt.Equal(wantStart) {
		t.Errorf("clone.StartAt = %v, want %v", clone.StartAt, wantStart)
	}
	if !clone.RegistrationOpensAt.Equal(wantStart.Add(-2 * time.Hour)) {
		t.Errorf("clone.RegistrationOpensAt = %v, want %v", clone.RegistrationOpensAt, wantStart.Add(-2*time.Hour))
	}
	if !clone.RegistrationClosesAt.Equal(wantStart.Add(-1 * time.Hour)) {
		t.Errorf("clone.RegistrationClosesAt = %v, want %v", clone.RegistrationClosesAt, wantStart.Add(-1*time.Hour))
	}
	if clone.Remarks == nil || *clone.Remarks != autoEventRemarks {
		t.Errorf("clone.Remarks = %v, want %q", clone.Remarks, autoEventRemarks)
	}
	if len(eventRepo.sysUsers) != 1 || eventRepo.sysUsers[0] != testSystemUserID {
		t.Errorf("clone created by = %v, want [%d]", eventRepo.sysUsers, testSystemUserID)
	}
	if txRepo.commits != 1 || txRepo.rollbacks != 0 {
		t.Errorf("commits = %d, rollbacks = %d, want 1/0", txRepo.commits, txRepo.rollbacks)
	}
}

func TestDoAutoEventCreation_ClaimLostRaceSkipsClone(t *testing.T) {
	now := time.Date(2026, time.September, 6, 12, 0, 0, 0, time.Local)

	eventRepo := &fakeEventRepo{templates: []entity.AutoCreateEventTemplate{dueTodayTemplate(now)}}
	occRepo := &fakeOccurrenceRepo{win: false} // slot already claimed by someone else
	txRepo := &fakeTxRepo{}
	worker := newTestWorker(eventRepo, occRepo, txRepo)

	worker.doAutoEventCreation(context.Background())

	if len(eventRepo.created) != 0 {
		t.Errorf("created = %d, want 0 (lost the race)", len(eventRepo.created))
	}
	if txRepo.commits != 0 {
		t.Errorf("commits = %d, want 0", txRepo.commits)
	}
	if txRepo.rollbacks != 1 {
		t.Errorf("rollbacks = %d, want 1", txRepo.rollbacks)
	}
}

func TestDoAutoEventCreation_PerTemplateErrorIsolation(t *testing.T) {
	now := time.Date(2026, time.September, 6, 12, 0, 0, 0, time.Local)
	broken := dueTodayTemplate(now)
	broken.Id = 1
	healthy := dueTodayTemplate(now)
	healthy.Id = 2

	eventRepo := &fakeEventRepo{
		templates: []entity.AutoCreateEventTemplate{broken, healthy},
		createErr: context.DeadlineExceeded,
		errAt:     0, // first CreateEventInTx call fails, second succeeds
	}
	occRepo := &fakeOccurrenceRepo{win: true}
	txRepo := &fakeTxRepo{}
	worker := newTestWorker(eventRepo, occRepo, txRepo)

	worker.doAutoEventCreation(context.Background())

	if len(eventRepo.created) != 1 {
		t.Fatalf("created = %d, want 1 (second template must survive the first failure)", len(eventRepo.created))
	}
	if eventRepo.created[0].Title != healthy.Title {
		t.Errorf("created template = %q, want the healthy one", eventRepo.created[0].Title)
	}
	if txRepo.commits != 1 || txRepo.rollbacks != 1 {
		t.Errorf("commits = %d, rollbacks = %d, want 1/1", txRepo.commits, txRepo.rollbacks)
	}
}

func TestProcessTemplate_GateFailsClosedOnGarbage(t *testing.T) {
	now := time.Date(2026, time.September, 6, 12, 0, 0, 0, time.Local)
	template := dueTodayTemplate(now)
	template.AutoCreateAt = &[]string{"whenever"}[0]

	eventRepo := &fakeEventRepo{}
	occRepo := &fakeOccurrenceRepo{win: true}
	txRepo := &fakeTxRepo{}
	worker := newTestWorker(eventRepo, occRepo, txRepo)

	worker.processTemplate(context.Background(), template, now)

	if len(occRepo.claims) != 0 || len(eventRepo.created) != 0 {
		t.Errorf("unparseable gate must fail closed: claims = %d, created = %d, want 0/0",
			len(occRepo.claims), len(eventRepo.created))
	}
}

func TestProcessTemplate_GateNotYetPassedSkipsTemplate(t *testing.T) {
	now := time.Date(2026, time.September, 6, 8, 0, 0, 0, time.Local)
	template := dueTodayTemplate(now)
	template.AutoCreateAt = &[]string{"09:00:00"}[0]

	eventRepo := &fakeEventRepo{}
	occRepo := &fakeOccurrenceRepo{win: true}
	txRepo := &fakeTxRepo{}
	worker := newTestWorker(eventRepo, occRepo, txRepo)

	worker.processTemplate(context.Background(), template, now)

	if len(occRepo.claims) != 0 || len(eventRepo.created) != 0 {
		t.Errorf("before the gate nothing must happen: claims = %d, created = %d, want 0/0",
			len(occRepo.claims), len(eventRepo.created))
	}
}

func TestProcessTemplate_NilGateCreatesImmediately(t *testing.T) {
	now := time.Date(2026, time.September, 6, 12, 0, 0, 0, time.Local)
	template := dueTodayTemplate(now)
	template.AutoCreateAt = nil

	eventRepo := &fakeEventRepo{}
	occRepo := &fakeOccurrenceRepo{win: true}
	txRepo := &fakeTxRepo{}
	worker := newTestWorker(eventRepo, occRepo, txRepo)

	worker.processTemplate(context.Background(), template, now)

	if len(occRepo.claims) != 1 || len(eventRepo.created) != 1 {
		t.Errorf("no gate means due today: claims = %d, created = %d, want 1/1",
			len(occRepo.claims), len(eventRepo.created))
	}
}
