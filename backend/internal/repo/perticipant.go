package repo

import (
	"identity-rbac/internal/event"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type PerticipantRepo interface {
	event.PerticipantRepo
}

type perticipantRepo struct {
	table string
	db    *sqlx.DB
	psql  sq.StatementBuilderType
}

func NewPerticipantRepo(db *DB) PerticipantRepo {
	return &perticipantRepo{
		table: "participants",
		db:    db.Db,
		psql:  db.Psql,
	}
}
