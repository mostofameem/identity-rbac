package repo

import (
	"identity-rbac/internal/event"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type EventTypeSettingRepo interface {
	event.EventTypeSettingRepo
}

type eventTypeSettingRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewEventSettingRepo(db *DB) EventTypeSettingRepo {
	return &eventTypeSettingRepo{
		table: "event_type_settings",
		db:    db.Db,
		psql:  db.Psql,
	}
}
