package repo

import (
	"log/slog"

	"github.com/jmoiron/sqlx"
	migrate "github.com/rubenv/sql-migrate"
)

func MigrateDB(db *sqlx.DB, dir string) error {
	migrations := &migrate.FileMigrationSource{
		Dir: dir,
	}

	_, err := migrate.Exec(db.DB, "postgres", migrations, migrate.Up)
	if err == nil {
		slog.Info("Successfully migrate database")
	}

	return err
}
