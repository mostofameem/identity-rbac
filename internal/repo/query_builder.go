package repo

import (
	"time"

	sq "github.com/Masterminds/squirrel"
)

const (
	UPCOMING = "UPCOMING"
	RECENT   = "RECENT"
	ONGOING  = "ONGOING"

	ALL               = "ALL"
	REGISTERED        = "REGISTERED"
	CANCELED          = "CANCELED"
	LATE_REGISTRATION = "LATE_REGISTERED"

	startAt   = "start_at"
	createdAt = "created_at"
)

func GetQueryBuilder() sq.StatementBuilderType {
	return sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
}

type BuildQuery func() sq.SelectBuilder

type queryBuilder struct {
	query sq.SelectBuilder
}

func NewQueryBuilder(buildQuery BuildQuery) *queryBuilder {
	return &queryBuilder{
		query: buildQuery(),
	}
}

func (q *queryBuilder) FilterByPrefix(key, val string) *queryBuilder {
	if val != "" {
		q.query = q.query.Where(sq.Like{key: val + "%"})
	}
	return q
}

func (q *queryBuilder) FilterByFullText(key, val string) *queryBuilder {
	if val != "" {
		q.query = q.query.Where(sq.Like{key: "%" + val + "%"})
	}
	return q
}

func (q *queryBuilder) FilterByIntEq(key string, val int) *queryBuilder {
	if val != 0 {
		q.query = q.query.Where(sq.Eq{key: val})
	}
	return q
}

func (q *queryBuilder) FilterByStrEq(key string, val string) *queryBuilder {
	if val != "" {
		q.query = q.query.Where(sq.Eq{key: val})
	}
	return q
}

func (q *queryBuilder) FilterByTimeRange(key string, from, to *time.Time) *queryBuilder {
	if from != nil && to != nil {
		q.query = q.query.Where(sq.Expr(key+" BETWEEN ? AND ?", from, to))
	}
	return q
}

func (q *queryBuilder) Limit(limit int) *queryBuilder {
	if limit > 0 {
		q.query = q.query.Limit(uint64(limit))
	}
	return q
}

func (q *queryBuilder) Offset(offset int) *queryBuilder {
	if offset > 0 {
		q.query = q.query.Offset(uint64(offset))
	}
	return q
}

func (q *queryBuilder) OrderBy(sortBy, sortOrder string) *queryBuilder {
	if len(sortBy) > 0 && len(sortOrder) > 0 {
		if sortBy == "startAt" {
			q.query = q.query.OrderBy(startAt + " " + sortOrder)
		} else {
			q.query = q.query.OrderBy(sortBy + " " + sortOrder)
		}
	}
	return q
}

func (q *queryBuilder) GroupBy(groupBy ...string) *queryBuilder {
	q.query = q.query.GroupBy(groupBy...)
	return q
}

func (q *queryBuilder) FilterByMode(key string, val time.Time) *queryBuilder {
	switch key {
	case UPCOMING:
		q.query = q.query.Where(sq.GtOrEq{"registration_opens_at": val})

	case ONGOING:
		q.query = q.query.Where(
			sq.Expr("? BETWEEN registration_opens_at AND start_at", val),
		)

	case RECENT:
		q.query = q.query.Where(sq.LtOrEq{"start_at": val})
	}
	return q
}

func (q *queryBuilder) ToSql() (string, []interface{}, error) {
	return q.query.ToSql()
}

func (q *queryBuilder) FilterByRegType(key string, val string) *queryBuilder {
	switch val {
	case REGISTERED:
		q.query = q.query.Where(sq.Eq{key: []string{REGISTERED, LATE_REGISTRATION}})
	case CANCELED, LATE_REGISTRATION:
		q.query = q.query.Where(sq.Eq{key: val})
	}

	return q
}
