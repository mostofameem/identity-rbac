package repo

import (
	"context"
	"identity-rbac/internal/event"

	"github.com/jmoiron/sqlx"
)

type Transaction interface {
	event.TransactionRepo
}

type transaction struct {
	db *sqlx.DB
}

func NewTransaction(db *DB) Transaction {
	return &transaction{
		db: db.Db,
	}
}

func (t *transaction) BeginTx(ctx context.Context) (*sqlx.Tx, error) {
	return t.db.BeginTxx(ctx, nil)
}

func (t *transaction) CommitTx(ctx context.Context, tx *sqlx.Tx) error {
	return tx.Commit()
}

func (t *transaction) RollbackTx(ctx context.Context, tx *sqlx.Tx) error {
	return tx.Rollback()
}
