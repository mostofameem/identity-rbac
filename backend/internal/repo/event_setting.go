package repo

import (
	"identity-rbac/internal/event"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type EventSettingRepo interface {
	event.EventSettingRepo
}

type eventSettingRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewEventSettingRepo(db *DB) EventSettingRepo {
	return &eventSettingRepo{
		table: "event_settings",
		db:    db.Db,
		psql:  db.Psql,
	}
}
