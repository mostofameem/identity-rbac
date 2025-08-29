package handlers

import (
	"encoding/json"
	"errors"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/rbac"
	"identity-rbac/internal/util"
	"log"
	"net"
	"net/http"
	"strings"
)

type InviteUserReq struct {
	UserName string `json:"userName" validation:"required"`
	RoleIds  []int  `json:"roleIds" validation:"required"`
	Email    string `json:"email"  validation:"required,email"`
}

type GetAccessToken struct {
	RefreshToken string `form:"token" validate:"required"`
}

type GetUsersReq struct {
	Email string `form:"email"`
}

type ResetPasswordReq struct {
	UserID      int    `validation:"required"`
	OldPassword string `json:"oldPassword"  validation:"required"`
	NewPassword string `json:"newPassword"  validation:"required,min=6"`
}

func (handlers *Handlers) GetUserPermissions(w http.ResponseWriter, r *http.Request) {
	userId, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		utils.SendError(w, http.StatusBadRequest, "User ID not found in context")
		return
	}

	permissions, err := handlers.rbacSvc.GetUserPermission(r.Context(), userId)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to get user permissions")
		return
	}

	utils.SendData(w, map[string]any{
		"data": permissions,
	})
}

func (handlers *Handlers) GetAccessToken(w http.ResponseWriter, r *http.Request) {
	req := GetAccessToken{}

	err := utils.BindValues(&req, r.URL.Query())
	if err != nil {
		log.Printf("Failed to extract query params: %v\n", err)
		utils.SendError(w, http.StatusBadRequest, "Invalid query params")
		return
	}

	if err := utils.Validate(req); err != nil {
		log.Printf("Validation failed: %v\n", err)
		utils.SendError(w, http.StatusBadRequest, "Validation error")
		return
	}

	accessToken, err := handlers.rbacSvc.GetAccessTokenFromRefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		log.Printf("Token exchange failed: %v\n", err)
		utils.SendError(w, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	utils.SendData(w, map[string]any{
		"accessToken": accessToken,
	})
}

func (handlers *Handlers) GetUsers(w http.ResponseWriter, r *http.Request) {
	var getUsersReq GetUsersReq

	err := utils.BindValues(&getUsersReq, r.URL.Query())
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Failed to extract query params")
		return
	}

	response, err := handlers.rbacSvc.GetUsers(r.Context(), getUsersReq.Email)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to get permissions")
		return
	}

	utils.SendData(w, map[string]any{
		"data": response,
	})
}

func (handlers *Handlers) InviteUser(w http.ResponseWriter, r *http.Request) {
	var inviteUserReq InviteUserReq
	if err := json.NewDecoder(r.Body).Decode(&inviteUserReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(inviteUserReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid event type")
		return
	}

	createdBy, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
		return
	}

	err := handlers.rbacSvc.InviteUser(r.Context(), rbac.InviteUserReq{
		UserName:  inviteUserReq.UserName,
		Email:     inviteUserReq.Email,
		RoleIds:   inviteUserReq.RoleIds,
		InvitedBy: createdBy,
		CreatedAt: util.GetCurrentTime(),
	})
	if err != nil {
		if errors.Is(err, util.ErrAlreadyRegistered) {
			utils.SendError(w, http.StatusConflict, "Conflict: User already exists")
			return
		} else if errors.Is(err, util.ErrNotFound) {
			utils.SendError(w, http.StatusNotFound, "Not Found: Role does not exist")
			return
		}
		utils.SendError(w, http.StatusInternalServerError, "Internal Server Error: Failed to create new user")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Successfully invited new user",
		"status":  "success",
	})
}

func (handlers *Handlers) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var resetPassReq ResetPasswordReq
	if err := json.NewDecoder(r.Body).Decode(&resetPassReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userID, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	resetPassReq.UserID = userID

	if err := utils.Validate(resetPassReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request parameters")
		return
	}

	err := handlers.rbacSvc.ResetPassword(r.Context(), rbac.ResetPasswordReq{
		UserID:      resetPassReq.UserID,
		OldPassword: resetPassReq.OldPassword,
		NewPassword: resetPassReq.NewPassword,
	})
	if err != nil {
		if errors.Is(err, util.ErrPasswordMismatch) {
			utils.SendError(w, http.StatusBadRequest, "Wrong Password: Old password does not match")
			return
		} else if errors.Is(err, util.ErrNotFound) {
			utils.SendError(w, http.StatusNotFound, "Not Found: User not exist")
			return
		}
		utils.SendError(w, http.StatusInternalServerError, "Internal Server Error: Failed to create new user")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Successfully Updated new password",
	})
}

func getClientIP(r *http.Request) net.IP {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			ip := strings.TrimSpace(ips[0])
			if parsedIP := net.ParseIP(ip); parsedIP != nil {
				return parsedIP
			}
		}
	}

	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		if parsedIP := net.ParseIP(xri); parsedIP != nil {
			return parsedIP
		}
	}

	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		if parsedIP := net.ParseIP(r.RemoteAddr); parsedIP != nil {
			return parsedIP
		}
		return nil
	}

	if parsedIP := net.ParseIP(ip); parsedIP != nil {
		return parsedIP
	}

	return nil
}
