package handlers

import (
	"encoding/json"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/rbac"
	"identity-rbac/pkg/logger"
	"log/slog"
	"net/http"
	"time"
)

type CreatePermissionReq struct {
	Name       string `json:"name"        validate:"required"`
	Permission string `json:"permission"   validate:"required"`
	CreatedBy  int    `validate:"required"`
}

type AddPermissionToRoleReq struct {
	RoleID       int `json:"roleId"          validate:"required"`
	PermissionID int `json:"permissionId"    validate:"required"`
	AddedBy      int `validate:"required"`
}

type GetPermissionsReq struct {
	Title string `form:"title"`
}

func (handlers *Handlers) AddPermission(w http.ResponseWriter, r *http.Request) {
	currentTime := time.Now()
	var req CreatePermissionReq

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	req.CreatedBy, _ = r.Context().Value(middlewares.UidKey).(int)

	if err := utils.Validate(req); err != nil {
		slog.Error("validation failed", logger.Extra(map[string]any{
			"req": req,
		}))
		utils.SendError(w, http.StatusBadRequest, "Invalid req params")
		return
	}

	err := handlers.rbacSvc.CreateNewPermission(r.Context(), &rbac.AddPermission{
		Name:       req.Name,
		Operations: req.Permission,
		CreatedBy:  req.CreatedBy,
		CreatedAt:  currentTime,
	})
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to create permission")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Successfully created permission",
	})
}

func (handlers *Handlers) GetPermissions(w http.ResponseWriter, r *http.Request) {
	var getPermissionsReq GetPermissionsReq

	err := utils.BindValues(&getPermissionsReq, r.URL.Query())
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Failed to extract query params")
		return
	}

	response, err := handlers.rbacSvc.GetPermissions(r.Context(), getPermissionsReq.Title)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to get permissions")
		return
	}

	utils.SendData(w, map[string]any{
		"data": response,
	})
}

func (handlers *Handlers) AddPermissionToRole(w http.ResponseWriter, r *http.Request) {
	currentTime := time.Now()
	var addPermissionToRoleReq AddPermissionToRoleReq

	if err := json.NewDecoder(r.Body).Decode(&addPermissionToRoleReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	addPermissionToRoleReq.AddedBy, _ = r.Context().Value(middlewares.UidKey).(int)

	if err := utils.Validate(addPermissionToRoleReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid req params")
		return
	}

	err := handlers.rbacSvc.AddPermissionToRole(r.Context(), &rbac.AddPermissionToRole{
		RoleID:       addPermissionToRoleReq.RoleID,
		PermissionID: addPermissionToRoleReq.PermissionID,
		AddedBy:      addPermissionToRoleReq.AddedBy,
		CreatedAt:    currentTime,
	})
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to add permission to role")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Successfully added permission to role",
	})
}
