package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"identity-rbac/config"
	"identity-rbac/internal/rbac"
	repo "identity-rbac/internal/repo"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"io/ioutil"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var serveAddUserCmd = &cobra.Command{
	Use:   "serve-add-user",
	Short: "Initialize the user, role, permission, and module",
	RunE:  serveAddUser,
}

type User struct {
	Email    string `json:"userEmail"`
	Password string `json:"userPassword"`
}

func serveAddUser(cmd *cobra.Command, args []string) error {
	userInfo, err := loadUserFromConfig("./user_config.json")
	if err != nil {
		return fmt.Errorf("failed to load user config: %w", err)
	}

	userInfo.Password, err = util.HashPassword(userInfo.Password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	cnf := config.GetConfig()

	db, err := repo.NewMysqlDB(cnf.DB)
	if err != nil {
		slog.Error("Failed to Connect with Database:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	defer repo.CloseMysqlDB(db)

	userId, err := addUser(db, *userInfo)
	if err != nil {
		slog.Error("Failed to add user:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	slog.Info("User added successful", logger.Extra(map[string]any{
		"userId": userId,
	}))

	roleRepo := repo.NewRoleRepo(db)
	userHasRoleRepo := repo.NewUserHasRoleRepo(db)

	roleId, err := roleRepo.Get(context.Background(), "Super Admin")
	if err != nil {
		slog.Error("Failed to get role:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}

	_, err = userHasRoleRepo.Create(context.Background(), rbac.AddRoleToUser{
		UserID:    int(userId),
		RoleID:    roleId[0].Id,
		AddedBy:   1,
		CreatedAt: time.Now(),
	})
	if err != nil {
		slog.Error("Failed to add role to user:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return err
	}
	slog.Info("Role assigned to user successful", logger.Extra(map[string]any{
		"userId": userId,
		"roleId": roleId[0].Id,
	}))

	return nil
}

func addUser(db *repo.DB, user User) (int64, error) {
	if user.Email == "" || user.Password == "" {
		return 0, fmt.Errorf("email and password cannot be empty")
	}

	query := "INSERT INTO users (email, pass, is_active) VALUES (?, ?, ?)"

	result, err := db.Db.Exec(query, user.Email, user.Password, true)
	if err != nil {
		return 0, fmt.Errorf("failed to insert user: %w", err)
	}

	userId, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert id: %w", err)
	}

	fmt.Println("User added successfully.")
	return userId, nil
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

func loadUserFromConfig(path string) (*User, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("could not open config file: %w", err)
	}
	defer file.Close()

	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("could not read config file: %w", err)
	}

	var user User
	if err := json.Unmarshal(bytes, &user); err != nil {
		return nil, fmt.Errorf("could not parse JSON: %w", err)
	}

	return &user, nil
}
