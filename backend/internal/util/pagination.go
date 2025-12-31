package util

type Pagination struct {
	Page      int `json:"page"`
	Limit     int `json:"limit"`
	TotalPage int `json:"totalPage"`
	TotalItem int `json:"totalItem"`
}

func GetPaginationResponse(totalItem, page, limit int) Pagination {
	totalPage := 0
	if limit > 0 {
		totalPage = (totalItem + limit - 1) / limit
	}

	return Pagination{
		Page:      page,
		Limit:     limit,
		TotalPage: totalPage,
		TotalItem: totalItem,
	}
}
