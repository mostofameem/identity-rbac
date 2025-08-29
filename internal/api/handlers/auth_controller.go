package handlers

import (
	"encoding/json"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/rbac"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log/slog"
	"net/http"

	"github.com/markbates/goth/gothic"
)

type LoginReq struct {
	Email string `json:"email" validate:"required"`
	Pass  string `json:"password" validate:"required"`
}

type RegisterReq struct {
	FirstName string `json:"firstName" validate:"required"`
	LastName  string `json:"lastName" validate:"required"`
	Password  string `json:"password" validate:"required"`
}

func (handlers *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	var loginReq LoginReq
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(loginReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid req params")
		return
	}

	ipStr := getClientIP(r).String()
	userAgent := r.Header.Get("User-Agent")

	accessToken, refreshToken, err := handlers.rbacSvc.Login(r.Context(), rbac.LoginWithSessionParams{
		Email:     loginReq.Email,
		Pass:      loginReq.Pass,
		IpAddress: &ipStr,
		UserAgent: &userAgent,
	})
	if err != nil {
		if err == rbac.ErrInvalidPassword {
			utils.SendError(w, 401, "email and password didn't match")
			return
		}
		if err == rbac.ErrUserNotFound {
			utils.SendError(w, 401, "you are not a user")
			return
		}

		utils.SendError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	if accessToken == "" || refreshToken == "" {
		utils.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	utils.SendData(w, map[string]any{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"message":      "User Login Succesfully",
		"status":       "Ok",
	})
}

func (handlers *Handlers) AuthLogin(w http.ResponseWriter, r *http.Request) {
	user, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	accessToken, refreshToken, err := handlers.rbacSvc.AuthLogin(r.Context(), user.Email)
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "Failed to get user")
		return
	}

	if accessToken == "" || refreshToken == "" {
		utils.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	utils.SendData(w, map[string]any{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (handlers *Handlers) Register(w http.ResponseWriter, r *http.Request) {
	var registerReq RegisterReq
	if err := json.NewDecoder(r.Body).Decode(&registerReq); err != nil {
		slog.Error("Failed to decode request body", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userEmail, ok := r.Context().Value(middlewares.UserEmailKey).(string)
	if !ok {
		utils.SendError(w, http.StatusBadRequest, "User ID not found in context")
		return
	}

	roleIds, ok := r.Context().Value(middlewares.RoleIdsKey).([]int)
	if !ok {
		utils.SendError(w, http.StatusBadRequest, "Role IDs not found in context")
		return
	}

	if err := utils.Validate(registerReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid event type")
		return
	}

	err := handlers.rbacSvc.CreateUserWithMultipleRoles(r.Context(), rbac.RegisterUserReq{
		Email:     userEmail,
		Password:  registerReq.Password,
		FirstName: registerReq.FirstName,
		LastName:  registerReq.LastName,
		RoleIds:   roleIds,
		IsActive:  true,
		CreatedAt: util.GetCurrentTime(),
	})
	if err != nil {
		if err == util.ErrAlreadyRegistered {
			utils.SendError(w, http.StatusBadRequest, "User already registered")
			return
		}

		utils.SendError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	utils.SendDataWithStatus(w, map[string]any{
		"message": "User Registered successfully",
	}, http.StatusCreated)
}
