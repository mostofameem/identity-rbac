package utils

import (
	"math"
	"strconv"

	"net/http"
)

type FilterParams map[string][]string

type PaginationParams struct {
	Page      int
	Limit     int
	Search    string
	SortBy    string
	SortOrder string
	Filters   FilterParams
}

const (
	maxLimit         = 100.0
	IdKey            = "id"
	SrcKey           = "src"
	DestKey          = "dest"
	pageKey          = "page"
	limitKey         = "limit"
	searchKey        = "search"
	sortByKey        = "sortBy"
	sortOrderKey     = "sortOrder"
	defaultSortBy    = "id"
	defaultSortOrder = "desc"
)

func ParsePage(r *http.Request) int {
	pageStr := r.URL.Query().Get(pageKey)
	page, _ := strconv.ParseInt(pageStr, 10, 32)
	return int(page)
}

func ParseId(r *http.Request) int {
	idStr := r.URL.Query().Get(IdKey)
	id, _ := strconv.ParseInt(idStr, 10, 32)
	id = int64(math.Max(1.0, float64(id)))
	return int(id)
}

func ParseSrc(r *http.Request) string {
	src := r.URL.Query().Get(SrcKey)
	return src
}

func ParseDest(r *http.Request) string {
	dest := r.URL.Query().Get(DestKey)
	return dest
}

func ParseLimit(r *http.Request) int {
	limitStr := r.URL.Query().Get(limitKey)
	limit, _ := strconv.ParseInt(limitStr, 10, 32)
	limit = int64(math.Max(0.0, math.Min(maxLimit, float64(limit))))
	return int(limit)
}

func CountTotalPages(limit, totalItems int) int {
	return int(math.Ceil(float64(totalItems) / math.Max(1.0, float64(limit))))
}

func GetPaginationParams(r *http.Request) PaginationParams {
	params := PaginationParams{
		Page:      1,
		Limit:     10,
		Search:    "",
		SortBy:    defaultSortBy,
		SortOrder: defaultSortOrder,
		Filters:   FilterParams{},
	}

	for k, v := range r.URL.Query() {
		switch k {
		case pageKey:
			// parse page number
			params.Page = ParsePage(r)

		case limitKey:
			// parse limit
			params.Limit = ParseLimit(r)

		case searchKey:
			// parse search term
			params.Search = r.URL.Query().Get(searchKey)

		case sortByKey:
			// parse sort by
			params.SortBy = r.URL.Query().Get(sortByKey)

		case sortOrderKey:
			// parse sort order
			params.SortOrder = r.URL.Query().Get(sortOrderKey)

		default:
			// any other filter parameter
			params.Filters[k] = v
		}
	}

	return params
}

// func GetSortingData(r *http.Request, defaultSortBy, defaultSortOrder string) (sortBy, sortOrder string) {
// 	params := GetPaginationParams(r, defaultSortBy, defaultSortOrder)
// 	return params.SortBy, params.SortOrder
// }

func ConfigPageSize(page, limit int) (int, int) {
	PageLimit := 20
	Offset := 0

	PageLimit = min(limit, PageLimit)
	Offset = PageLimit * page

	return PageLimit, Offset
}
