package entity

import (
	"net"
	"time"

	"github.com/google/uuid"
)


type UserSession struct {
	Id           int       `db:"id" json:"id"`
	UserId       int       `db:"user_id" json:"userId"`
	Jti          uuid.UUID `db:"jti" json:"jti"`
	IpAddress    *net.IP   `db:"ip_address" json:"ipAddress"`
	UserAgent    *string   `db:"user_agent" json:"userAgent"`
	IsActive     bool      `db:"is_active" json:"isActive"`
	ExpiresAt    time.Time `db:"expires_at" json:"expiresAt"`
	LastActivity time.Time `db:"last_activity" json:"lastActivity"`
	CreatedAt    time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt    time.Time `db:"updated_at" json:"updatedAt"`
}
