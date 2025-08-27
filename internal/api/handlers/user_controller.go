package handlers

import (
	"encoding/json"
	"errors"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/rbac"
	"identity-rbac/internal/util"
	"log"
	"net/http"

	"github.com/markbates/goth/gothic"
)

const (
	DEFAULT_PASSWORD = "123123"
)

type LoginReq struct {
	Email string `json:"email" validate:"required"`
	Pass  string `json:"password" validate:"required"`
}

type RegisterReq struct {
	Email     string `validate:"required,email"`
	FirstName string `json:"firstName" validate:"required"`
	LastName  string `json:"lastName" validate:"required"`
	Password  string `json:"password" validate:"required"`
}

type AddUserReq struct {
	Email string `json:"email" validation:"required"`
}

type AddUserV2Req struct {
	RoleIds []int  `json:"roleIds" validation:"required"`
	Email   string `json:"email"  validation:"required,email"`
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

	accessToken, refreshToken, err := handlers.rbacSvc.Login(r.Context(), rbac.LoginParams{
		Email: loginReq.Email,
		Pass:  loginReq.Pass,
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
	})
}

func (handlers *Handlers) Register(w http.ResponseWriter, r *http.Request) {
	var registerReq RegisterReq
	if err := json.NewDecoder(r.Body).Decode(&registerReq); err != nil {
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
		utils.SendError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	utils.SendDataWithStatus(w, map[string]any{
		"message": "User Registered successfully",
	}, http.StatusCreated)
}

func (handlers *Handlers) AddUser(w http.ResponseWriter, r *http.Request) {
	var addUserReq AddUserReq
	if err := json.NewDecoder(r.Body).Decode(&addUserReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(addUserReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid event type")
		return
	}

	// err := handlers.rbacSvc.CreateUser(r.Context(), rbac.RegisterUserReq{
	// 	Email:     addUserReq.Email,
	// 	Pass:      "123123",
	// 	IsActive:  true,
	// 	CreatedAt: util.GetCurrentTime(),
	// })
	// if err != nil {
	// 	utils.SendError(w, http.StatusInternalServerError, "Failed to create user")
	// 	return
	// }

	utils.SendData(w, map[string]any{
		"message": "Successfully added new user",
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

func (handlers *Handlers) LoginV2(w http.ResponseWriter, r *http.Request) {
	var loginReq LoginReq
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(loginReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid req params")
		return
	}

	accessToken, refreshToken, permissions, err := handlers.rbacSvc.LoginV2(r.Context(), rbac.LoginParams{
		Email: loginReq.Email,
		Pass:  loginReq.Pass,
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
		"permissions":  permissions,
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

func (handlers *Handlers) AddUserV2(w http.ResponseWriter, r *http.Request) {
	var addUserReq AddUserV2Req
	if err := json.NewDecoder(r.Body).Decode(&addUserReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(addUserReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid event type")
		return
	}

	// createdBy, ok := r.Context().Value(middlewares.UidKey).(int)
	// if !ok {
	// 	utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
	// 	return
	// }

	// err := handlers.rbacSvc.CreateUserV2WithMultipleRoles(r.Context(), rbac.CreateUserV2Req{
	// 	Email:     addUserReq.Email,
	// 	Pass:      DEFAULT_PASSWORD,
	// 	RoleIds:   addUserReq.RoleIds,
	// 	IsActive:  true,
	// 	CreatedBy: createdBy,
	// 	CreatedAt: util.GetCurrentTime(),
	// })
	// if err != nil {
	// 	if errors.Is(err, util.ErrAlreadyRegistered) {
	// 		utils.SendError(w, http.StatusConflict, "Conflict: User already exists")
	// 		return
	// 	} else if errors.Is(err, util.ErrNotFound) {
	// 		utils.SendError(w, http.StatusNotFound, "Not Found: Role does not exist")
	// 		return
	// 	}
	// 	utils.SendError(w, http.StatusInternalServerError, "Internal Server Error: Failed to create new user")
	// 	return
	// }

	utils.SendData(w, map[string]any{
		"message": "Successfully added new user",
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
