package repo

import (
	"identity-rbac/internal/event"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type EventRepo interface {
	event.EventRepo
}

type eventRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewEventRepo(db *DB) EventRepo {
	return &eventRepo{
		table: "events",
		db:    db.Db,
		psql:  db.Psql,
	}
}
