package cmd

import (
	"context"
	"database/sql"
	"fmt"
	"identity-rbac/config"
	"identity-rbac/internal/rbac"
	repo "identity-rbac/internal/repo"
	"identity-rbac/pkg/logger"
	"log/slog"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var serveSeedingCmd = &cobra.Command{
	Use:   "serve-seeding",
	Short: "database seeding command to insert initial data",
	RunE:  serveSeeding,
}

func serveSeeding(cmd *cobra.Command, args []string) error {
	cnf := config.GetConfig()

	db, err := repo.NewDB(cnf.DB)
	if err != nil {
		slog.Error("Failed to Connect with Database:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer repo.CloseDB(db)

	err = seedPermissions(db)
	if err != nil {
		slog.Error("Failed to seed permissions:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	err = createSuperAdminRoleAndAssignPermissions(db)
	if err != nil {
		slog.Error("Failed to create user role and assign permissions:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	err = seedEventTypesAndSettings(db)
	if err != nil {
		slog.Error("Failed to seed event types and settings:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	return nil
}

func seedPermissions(db *repo.DB) error {
	permissions := []struct {
		Name        string
		Resource    string
		Action      string
		Description string
	}{
		{"user.create", "user", "create", "User creation access"},
		{"user.update", "user", "update", "User update access"},
		{"user.delete", "user", "delete", "User delete access"},
		{"user.view", "user", "view", "User view access"},

		{"role.create", "role", "create", "Role creation access"},
		{"role.update", "role", "update", "Role update access"},
		{"role.delete", "role", "delete", "Role delete access"},
		{"role.view", "role", "view", "Role view access"},
		{"role.assign", "role", "assign", "Role assign access"},

		{"event.create", "event", "create", "Event create permission"},
		{"event.update", "event", "update", "Event update permission"},
		{"event.delete", "event", "delete", "Event delete permission"},
		{"event.view", "event", "view", "Event view permission"},

		{"event_type.create", "event_type", "create", "Event type create permission"},
		{"event_type.update", "event_type", "update", "Event type update permission"},
		{"event_type.delete", "event_type", "delete", "Event type delete permission"},
		{"event_type.view", "event_type", "view", "Event type view access"},

		{"perticipent.create", "perticipent", "create", "Perticipent creation access"},
		{"perticipent.update", "perticipent", "update", "Perticipent update access"},
		{"perticipent.delete", "perticipent", "delete", "Perticipent delete access"},
		{"perticipent.view", "perticipent", "view", "perticipent view access"},

		{"permission.view", "permission", "view", "Permission view access"},
		{"permission.assign", "permission", "assign", "Permission assign access"},
	}

	query := "INSERT INTO permissions (name, resource, action, description, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id"

	for _, p := range permissions {
		var id int
		err := db.Db.QueryRow(query, p.Name, p.Resource, p.Action, p.Description, 1).Scan(&id)
		if err != nil {
			return fmt.Errorf("failed to insert permission %s: %w", p.Name, err)
		}
		fmt.Printf("Inserted permission %s with ID: %d\n", p.Name, id)
	}

	fmt.Println("All permissions inserted successfully.")
	return nil
}

func createSuperAdminRoleAndAssignPermissions(db *repo.DB) error {
	roleRepo := repo.NewRoleRepo(db)

	roleId, err := roleRepo.Create(context.Background(), rbac.AddRole{
		Name:        "Super Admin",
		Description: "Super Admin role with all permissions",
		IsActive:    true,
		CreatedBy:   1,
		CreatedAt:   time.Now(),
	})
	if err != nil {
		slog.Error("Failed to add role:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	totalPermissions, err := getTotalPermissionNumber(db)
	if err != nil {
		slog.Error("Failed to add permission:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	err = addRoleHasPermission(db, 1, int(roleId), int(totalPermissions))
	if err != nil {
		slog.Error("Failed to add role has permission:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	return nil
}

func getTotalPermissionNumber(db *repo.DB) (int64, error) {
	var count int64
	query := "SELECT COUNT(id) FROM permissions"

	err := db.Db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func addRoleHasPermission(db *repo.DB, userId, roleId, totalPermissionNumber int) error {
	if totalPermissionNumber <= 0 {
		return fmt.Errorf("no permissions to assign")
	}

	query := "INSERT INTO role_permissions (role_id, permission_id, added_by) VALUES "
	args := []interface{}{}
	values := []string{}

	for i := 1; i <= totalPermissionNumber; i++ {
		paramOffset := (i-1)*3 + 1
		values = append(values, fmt.Sprintf("($%d, $%d, $%d)", paramOffset, paramOffset+1, paramOffset+2))
		args = append(args, roleId, i, userId)
	}

	query += strings.Join(values, ", ") + " ON CONFLICT (role_id, permission_id) DO NOTHING"

	_, err := db.Db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to insert role_has_permissions: %w", err)
	}

	fmt.Println("Role has permissions added successfully.")
	return nil
}

// seedEventTypesAndSettings inserts the default event types with their
// auto-creation settings — one per recurrence so every cadence is available
// out of the box. Idempotent: existing rows (matched by name / event type)
// are left untouched, so serve-seeding can be re-run safely.
func seedEventTypesAndSettings(db *repo.DB) error {
	type eventTypesSeed struct {
		Name         string
		Description  string
		AutoCreateAt string
		Recurrence   string
	}

	eventTypes := []eventTypesSeed{
		{"Daily Breakfast", "Daily event type", "08:00", "DAILY"},
		{"Daily Lunch", "Daily event type", "12:00", "DAILY"},
		{"Daily Dinner", "Daily event type", "18:00", "DAILY"},
		{"Weekly Meeting", "Weekly event type", "09:00", "WEEKLY"},
		{"Monthly Review", "Monthly event type", "09:00", "MONTHLY"},
		{"Yearly Planning", "Yearly event type", "09:00", "YEARLY"},
		{"Once-off Event", "Once event type", "09:00", "ONCE"},
	}

	for _, et := range eventTypes {
		eventTypeId, err := getOrInsertEventType(db, et.Name, et.Description)
		if err != nil {
			return err
		}

		err = insertEventTypeSettingsIfMissing(db, eventTypeId, et.AutoCreateAt, et.Recurrence)
		if err != nil {
			return err
		}
	}

	fmt.Println("Event types and settings seeded successfully.")
	return nil
}

func getOrInsertEventType(db *repo.DB, name, description string) (int, error) {
	var id int
	err := db.Db.QueryRow(
		"SELECT id FROM event_types WHERE name = $1 LIMIT 1", name,
	).Scan(&id)
	if err == nil {
		fmt.Printf("Event type %s already exists with ID: %d\n", name, id)
		return id, nil
	}
	if err != sql.ErrNoRows {
		return 0, fmt.Errorf("failed to check event type %s: %w", name, err)
	}

	err = db.Db.QueryRow(
		"INSERT INTO event_types (name, description, created_by, created_at, updated_at, is_active) VALUES ($1, $2, $3, $4, $4, true) RETURNING id",
		name, description, 1, time.Now(),
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("failed to insert event type %s: %w", name, err)
	}
	fmt.Printf("Inserted event type %s with ID: %d\n", name, id)
	return id, nil
}

func insertEventTypeSettingsIfMissing(db *repo.DB, eventTypeId int, autoCreateAt, recurrence string) error {
	var id int
	err := db.Db.QueryRow(
		"SELECT id FROM event_type_settings WHERE event_type_id = $1 LIMIT 1", eventTypeId,
	).Scan(&id)
	if err == nil {
		fmt.Printf("Event type settings already exist for event type ID: %d\n", eventTypeId)
		return nil
	}
	if err != sql.ErrNoRows {
		return fmt.Errorf("failed to check event type settings for %d: %w", eventTypeId, err)
	}

	err = db.Db.QueryRow(
		"INSERT INTO event_type_settings (event_type_id, auto_create_at, recurrence, created_by, updated_by, remarks, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $4, $5, true, $6, $6) RETURNING id",
		eventTypeId, autoCreateAt, recurrence, 1, "Seeded default settings", time.Now(),
	).Scan(&id)
	if err != nil {
		return fmt.Errorf("failed to insert event type settings for %d: %w", eventTypeId, err)
	}
	fmt.Printf("Inserted event type settings with ID: %d for event type ID: %d\n", id, eventTypeId)
	return nil
}
