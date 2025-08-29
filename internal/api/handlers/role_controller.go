package handlers

import (
	"encoding/json"
	"errors"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/rbac"
	"identity-rbac/internal/util"
	"net/http"
	"time"
)

type AddRoleReq struct {
	Name          string `json:"roleName"     validate:"required"`
	Description   string `json:"description"  validate:"required"`
	PermissionIDs []int  `json:"permissionIds" validate:"required"`
	CreatedBy     int    `validate:"required"`
}

type AddRoleToUserReq struct {
	UserID  int `json:"userId"    validate:"required"`
	RoleID  int `json:"roleId"    validate:"required"`
	AddedBy int `validate:"required"`
}

type GetRolesReq struct {
	Title string `form:"title"`
}

func (handlers *Handlers) AddRole(w http.ResponseWriter, r *http.Request) {
	currentTime := time.Now()
	var addRoleReq AddRoleReq

	if err := json.NewDecoder(r.Body).Decode(&addRoleReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	addRoleReq.CreatedBy, _ = r.Context().Value(middlewares.UidKey).(int)

	if err := utils.Validate(addRoleReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid req params")
		return
	}

	err := handlers.rbacSvc.CreateNewRoleV2(r.Context(), &rbac.AddRoleV2{
		Name:          addRoleReq.Name,
		Description:   addRoleReq.Description,
		PermissionIDs: addRoleReq.PermissionIDs,
		CreatedBy:     addRoleReq.CreatedBy,
		CreatedAt:     currentTime,
	})
	if err != nil {
		if errors.Is(err, util.ErrNotFound) {
			utils.SendError(w, http.StatusNotFound, "Not Found: One or more permissions do not exist")
			return
		}
		utils.SendError(w, http.StatusInternalServerError, "Failed to create role")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Successfully added new role with permissions",
	})
}

func (handlers *Handlers) GetRoles(w http.ResponseWriter, r *http.Request) {
	var getRolesReq GetRolesReq

	err := utils.BindValues(&getRolesReq, r.URL.Query())
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Failed to extract query params")
		return
	}

	rolesWithPermissions, err := handlers.rbacSvc.GetRolesWithPermissions(r.Context(), getRolesReq.Title)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to get roles")
		return
	}

	utils.SendData(w, map[string]any{
		"data":    rolesWithPermissions,
		"message": "Successfully fetched roles with permissions",
	})
}

func (handlers *Handlers) AddRoleToUser(w http.ResponseWriter, r *http.Request) {
	currentTime := util.GetCurrentTime()
	var addRoleToUserReq AddRoleToUserReq

	if err := json.NewDecoder(r.Body).Decode(&addRoleToUserReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	addRoleToUserReq.AddedBy, _ = r.Context().Value(middlewares.UidKey).(int)

	if err := utils.Validate(addRoleToUserReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid req params")
		return
	}

	err := handlers.rbacSvc.AddRoleToUser(r.Context(), &rbac.AddRoleToUser{
		UserID:    addRoleToUserReq.UserID,
		RoleID:    addRoleToUserReq.RoleID,
		AddedBy:   addRoleToUserReq.AddedBy,
		CreatedAt: currentTime,
	})
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to add role to user")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Successfully added role to user",
	})
}
