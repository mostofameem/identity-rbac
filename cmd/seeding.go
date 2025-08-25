package cmd

import (
	"context"
	"identity-rbac/config"
	"identity-rbac/internal/rbac"
	repo "identity-rbac/internal/repo"
	"identity-rbac/pkg/logger"
	"fmt"
	"log/slog"
	"time"

	"github.com/spf13/cobra"
)

const (
	EventView           = "EVENT_VIEW"
	ParticipationCreate = "PARTICIPANTS_CREATE"
)

var serveSeedingCmd = &cobra.Command{
	Use:   "serve-seeding",
	Short: "database seeding command to insert initial data",
	RunE:  serveSeeding,
}

func serveSeeding(cmd *cobra.Command, args []string) error {
	cnf := config.GetConfig()

	db, err := repo.NewMysqlDB(cnf.DB)
	if err != nil {
		slog.Error("Failed to Connect with Database:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer repo.CloseMysqlDB(db)

	err = seedEventTypes(db)
	if err != nil {
		slog.Error("Failed to seed event types:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	err = seedPermissions(db)
	if err != nil {
		slog.Error("Failed to seed permissions:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	err = createUserRoleAndAssignPermissions(db)
	if err != nil {
		slog.Error("Failed to create user role and assign permissions:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	err = createSuperAdminRoleAndAssignPermissions(db)
	if err != nil {
		slog.Error("Failed to create super admin role and assign permissions:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	return nil
}

func seedPermissions(db *repo.DB) error {
	permissions := []struct {
		Name       string
		Operations string
	}{
		{"EVENT_TYPE_CREATE", "Event type creation access"},
		{"EVENT_TYPE_UPDATE", "Event type update access"},
		{"EVENT_TYPE_DELETE", "Event type delete access"},
		{"EVENT_TYPE_VIEW", "Event type view access"},

		{"EVENT_CREATE", "Event creation access"},
		{"EVENT_UPDATE", "Event update access"},
		{"EVENT_DELETE", "Event delete access"},
		{"EVENT_VIEW", "Event view access"},

		{"PARTICIPANTS_CREATE", "Participant creation access"},
		{"PARTICIPANTS_UPDATE", "Participant update access"},
		{"PARTICIPANTS_DELETE", "Participant delete access"},
		{"PARTICIPANTS_VIEW", "Participant view access"},

		{"USER_CREATE", "User creation access"},
		{"USER_UPDATE", "User update access"},
		{"USER_DELETE", "User delete access"},
		{"USER_VIEW", "User view access"},

		{"ROLE_CREATE", "Role creation access"},
		{"ROLE_UPDATE", "Role update access"},
		{"ROLE_DELETE", "Role delete access"},
		{"ROLE_VIEW", "Role view access"},
		{"ROLE_ASSIGN", "Role assign access"},

		{"PERMISSION_CREATE", "Permission creation access"},
		{"PERMISSION_UPDATE", "PERMISSION_ASSIGN update access"},
		{"PERMISSION_DELETE", "PERMISSION_ASSIGN delete access"},
		{"PERMISSION_VIEW", "PERMISSION_ASSIGN view access"},
		{"PERMISSION_ASSIGN", "PERMISSION_ASSIGN assign access"},
	}

	query := "INSERT INTO permissions (name, operations, created_by) VALUES (?, ?, ?)"

	for _, p := range permissions {
		result, err := db.Db.Exec(query, p.Name, p.Operations, 1)
		if err != nil {
			return fmt.Errorf("failed to insert permission %s: %w", p.Name, err)
		}
		id, err := result.LastInsertId()
		if err != nil {
			return fmt.Errorf("failed to get last insert id for permission %s: %w", p.Name, err)
		}
		fmt.Printf("Inserted permission %s with ID: %d\n", p.Name, id)
	}

	fmt.Println("All permissions inserted successfully.")
	return nil
}

func seedEventTypes(db *repo.DB) error {
	eventTypes := []struct {
		Name        string
		Description string
	}{
		{"Once", "This is an one time event, it will not repeat"},
		{"Daily", "An event that occurs every day at a specific time"},
		{"Weekly", "An event that occurs once a week on a specific day"},
		{"Monthly", "An event that occurs once a month on a specific date"},
		{"Yearly", "An event that occurs once a year on a specific date"},
	}

	query := `INSERT INTO event_types 
	(name, description, created_by, auto_event_create, auto_event_interval_in_second, is_active) 
	VALUES (?, ?, ?, ?, ?, ?)`

	for _, et := range eventTypes {
		result, err := db.Db.Exec(query, et.Name, et.Description, 1, false, 0, true)
		if err != nil {
			return fmt.Errorf("failed to insert event type %s: %w", et.Name, err)
		}

		id, err := result.LastInsertId()
		if err != nil {
			return fmt.Errorf("failed to get last insert id for event type %s: %w", et.Name, err)
		}

		fmt.Printf("Inserted event type %s with ID: %d\n", et.Name, id)
	}

	fmt.Println("All event types inserted successfully.")
	return nil
}

func createUserRoleAndAssignPermissions(db *repo.DB) error {
	roleRepo := repo.NewRoleRepo(db)
	permissionRepo := repo.NewPermissionRepo(db)
	roleHasPermissionRepo := repo.NewRoleHasPermissionRepo(db)

	roleId, err := roleRepo.Create(context.Background(), rbac.AddRole{
		Name:        "User",
		Description: "This is a regular user role",
		CreatedBy:   1,
		CreatedAt:   time.Now(),
	})
	if err != nil {
		slog.Error("Failed to add role:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	eventViewPermissionId, err := permissionRepo.Get(context.Background(), EventView)
	if err != nil {
		slog.Error("Failed to get permission ID for 'EVENT_VIEW' :", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	participationCreatePermissionId, err := permissionRepo.Get(context.Background(), ParticipationCreate)
	if err != nil {
		slog.Error("Failed to get permission ID for 'PARTICIPANTS_CREATE' :", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	err = roleHasPermissionRepo.AddPermissionsToRole(context.Background(), rbac.AddRolePermissions{
		RoleID:        roleId,
		PermissionIDs: []int{(*eventViewPermissionId)[0].Id, (*participationCreatePermissionId)[0].Id},
		AddedBy:       1,
		CreatedAt:     time.Now(),
	})
	if err != nil {
		slog.Error("Failed to add role has permission:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
	}

	return nil
}

func createSuperAdminRoleAndAssignPermissions(db *repo.DB) error {
	roleRepo := repo.NewRoleRepo(db)

	roleId, err := roleRepo.Create(context.Background(), rbac.AddRole{
		Name:        "Super Admin",
		Description: "Role with all permissions",
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
