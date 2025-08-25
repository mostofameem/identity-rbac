package repo

import (
	"fmt"
	"identity-rbac/config"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type DB struct {
	Db   *sqlx.DB
	Psql sq.StatementBuilderType
}

func GetConnectionString(cnf *config.DBConfig) string {
	connectionString := fmt.Sprintf(
		"user=%s password=%s host=%s port=%d dbname=%s",
		cnf.User,
		cnf.Password,
		cnf.Host,
		cnf.Port,
		cnf.Name,
	)
	if cnf.EnableSSLMode {
		connectionString += " sslmode=require"
	} else {
		connectionString += " sslmode=disable"
	}

	return connectionString
}

func connect(cnf *config.DBConfig) (*sqlx.DB, error) {
	dbSource := GetConnectionString(cnf)

	dbCon, err := sqlx.Connect("postgres", dbSource)
	if err != nil {
		slog.Error(fmt.Sprintf("Connection error %v", err), logger.Extra(map[string]any{
			"error": err.Error(),
		}))

		return nil, err
	}

	if err := dbCon.Ping(); err != nil {
		slog.Error(fmt.Sprintf("DB ping error %v", err), logger.Extra(map[string]any{
			"error": err.Error(),
		}))

		return nil, err
	}

	dbCon.SetMaxOpenConns(cnf.MaxOpenConnections)
	dbCon.SetMaxIdleConns(cnf.MaxIdleConnections)
	dbCon.SetConnMaxIdleTime(time.Duration(cnf.MaxIdleTimeInMinutes) * time.Minute)

	return dbCon, nil
}

func NewDB(conf *config.DBConfig) (*DB, error) {
	Db, err := connect(conf)
	if err != nil {
		return nil, err
	}

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

	return &DB{
		Db:   Db,
		Psql: psql,
	}, nil
}

func CloseDB(db *DB) error {
	if err := db.Db.Close(); err != nil {
		return err
	}

	slog.Info("Disconnected from database")

	return nil
}
