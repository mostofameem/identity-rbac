package repo

import (
	"identity-rbac/internal/event"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type EventTypeRepo interface {
	event.EventTypeRepo
}

type eventTypeRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewEventTypeRepo(db *DB) EventTypeRepo {
	return &eventTypeRepo{
		table: "event_types",
		db:    db.Db,
		psql:  db.Psql,
	}
}
