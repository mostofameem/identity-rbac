package cmd

import (
	"context"
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
