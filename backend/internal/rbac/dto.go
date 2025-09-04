package rbac

import (
	"time"

	"github.com/google/uuid"
)

type AddRole struct {
	Name        string
	Description string
	CreatedBy   int
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   *time.Time
}

type AddRoleV2 struct {
	Name          string
	Description   string
	PermissionIDs []int
	CreatedBy     int
	CreatedAt     time.Time
	UpdatedAt     *time.Time
}

type AddPermission struct {
	Name        string
	Resource    string
	Action      string
	Description string
	CreatedBy   int
	CreatedAt   time.Time
	UpdatedAt   *time.Time
}

type AddRoleToUser struct {
	UserID    int
	RoleID    int
	AddedBy   int
	CreatedAt time.Time
}

type AddPermissionToRole struct {
	RoleID       int
	PermissionID int
	AddedBy      int
	CreatedAt    time.Time
}

type AddRolePermissions struct {
	RoleID        int
	PermissionIDs []int
	AddedBy       int
	CreatedAt     time.Time
}

type Roles struct {
	Id       int    `db:"id"        json:"id"`
	Name     string `db:"name"      json:"name"`
	IsActive bool   `db:"is_active" json:"isActive"`
}

type RolesWithPermissions struct {
	Id          int           `db:"id" json:"id"`
	Name        string        `db:"name" json:"name"`
	Description string        `db:"description" json:"description"`
	IsActive    bool          `db:"is_Active" json:"isActive"`
	CreatedAt   time.Time     `db:"created_at" json:"createdAt"`
	Permissions []Permissions `json:"permissions"`
}

type Permissions struct {
	Id          int    `db:"id" json:"id"`
	Name        string `db:"name" json:"name"`
	Resource    string `db:"resource" json:"resource"`
	Action      string `db:"action" json:"action"`
	Description string `db:"description" json:"description"`
}

type Users struct {
	Id        int       `db:"id"             json:"id"`
	Name      string    `                    json:"name"`
	Email     string    `db:"email"          json:"email"`
	IsActive  bool      `db:"is_active"      json:"isActive"`
	CreatedAt time.Time `db:"created_at"     json:"createdAt"`
	Roles     []Roles   `                    json:"roles"`
}

type ResetPasswordReq struct {
	UserID      int
	OldPassword string
	NewPassword string
}

type RegisterUserReq struct {
	Email     string
	Password  string
	FirstName string
	LastName  string
	RoleIds   []int
	IsActive  bool
	CreatedBy int
	CreatedAt time.Time
}

type UserOnboardingProcess struct {
	Id        string    `db:"id"`
	Email     string    `db:"email"`
	RoleIds   []int     `db:"role_ids"`
	Status    string    `db:"status"`
	Completed bool      `db:"completed"`
	CreatedBy int       `db:"created_by"`
	ExpiredAt time.Time `db:"expired_at"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

type CreateUserSessionReq struct {
	UserId    int
	Jti       uuid.UUID
	IpAddress *string
	UserAgent *string
	ExpiresAt time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type InviteUserReq struct {
	UserName  string
	Email     string
	RoleIds   []int
	InvitedBy int
	CreatedAt time.Time
}
