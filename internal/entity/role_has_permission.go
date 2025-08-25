package entity

import "time"

type RoleHasPermission struct {
	ID           int       `db:"id"               json:"id"`
	RoleID       int       `db:"roleId"           json:"userId"`
	ModuleId     int       `db:"module_id"        json:"moduleId"`
	PermissionID int       `db:"permission_id"    json:"permissionId"`
	AddedBy      int       `db:"added_by"         json:"addedBy"`
	CreatedAt    time.Time `db:"created_at"       json:"createdAt"`
}
