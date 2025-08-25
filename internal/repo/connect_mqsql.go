package repo

import (
	"fmt"
	"identity-rbac/config"
	"identity-rbac/pkg/logger"
	"log/slog"
	"time"

	sq "github.com/Masterminds/squirrel"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

type DBMysql struct {
	Db   *sqlx.DB
	Psql sq.StatementBuilderType
}

// Generates MySQL DSN: user:password@tcp(host:port)/dbname?parseTime=true
func GetMysqlConnectionString(cnf *config.DBConfig) string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?parseTime=true&multiStatements=true",
		cnf.User,
		cnf.Password,
		cnf.Host,
		cnf.Port,
		cnf.Name,
	)
}

func connectMysql(cnf *config.DBConfig) (*sqlx.DB, error) {
	dbSource := GetMysqlConnectionString(cnf)

	dbCon, err := sqlx.Connect("mysql", dbSource)
	if err != nil {
		slog.Error(fmt.Sprintf("Connection error: %v", err), logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	if err := dbCon.Ping(); err != nil {
		slog.Error(fmt.Sprintf("DB ping error: %v", err), logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return nil, err
	}

	dbCon.SetMaxOpenConns(cnf.MaxOpenConnections)
	dbCon.SetMaxIdleConns(cnf.MaxIdleConnections)
	dbCon.SetConnMaxIdleTime(time.Duration(cnf.MaxIdleTimeInMinutes) * time.Minute)

	return dbCon, nil
}

func NewMysqlDB(conf *config.DBConfig) (*DB, error) {
	db, err := connectMysql(conf)
	if err != nil {
		return nil, err
	}

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Question) // MySQL uses "?"

	return &DB{
		Db:   db,
		Psql: psql,
	}, nil
}

func CloseMysqlDB(db *DB) error {
	if err := db.Db.Close(); err != nil {
		return err
	}

	slog.Info("Disconnected from MySQL database")
	return nil
}
