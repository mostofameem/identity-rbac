package handlers

import (
	"encoding/json"
	"fmt"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/event"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"net/http"
	"time"
)

type CreateEventTypeRequest struct {
	Name        string `json:"name" validation:"required"`
	Description string `json:"description"`
}

type GetEventTypes struct {
	Name  string `form:"name" json:"name"`
	Page  int    `form:"page" json:"page"`
	Limit int    `form:"limit" json:"limit"`
}

type EventTypeSettingsRequest struct {
	EventTypeId                int    `json:"eventTypeId"                validation:"required"`
	AutoCreateAt               string `json:"autoCreateAt"               validation:"required"`
	AutoEventIntervalInMinutes int    `json:"autoEventIntervalInMinutes" validation:"required"`
	IsActive                   bool   `json:"isActive"                   validation:"required"`
}

type EventTypeStatusChangeRequest struct {
	Status enum.ActiveInactiveStatus `json:"status" validation:"required"`
}

func (handlers *Handlers) CreateEventType(w http.ResponseWriter, r *http.Request) {
	var req CreateEventTypeRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(req); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Validation error")
		return
	}

	// Get user ID from context (set by authentication middleware)
	createdBy := util.GetRequestedUserID(r)
	if createdBy == nil {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
		return
	}

	eventTypeId, err := handlers.eventSvc.CreateEventType(r.Context(), event.CreateEventTypeReq{
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   *createdBy,
		CreatedAt:   util.GetCurrentTime(),
		IsActive:    true,
	})

	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong. Please try again latter.")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Event Type created successfully",
		"data":    eventTypeId,
	})
}

func (handlers *Handlers) GetEventTypes(w http.ResponseWriter, r *http.Request) {
	var request GetEventTypes

	err := utils.BindValues(&request, r.URL.Query())
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Failed to extract query params")
		return
	}

	eventTypes, pagination, err := handlers.eventSvc.GetEventTypes(r.Context(), event.GetEventTypesReq{
		Name:  request.Name,
		Page:  request.Page,
		Limit: request.Limit,
	})
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}

	utils.SendData(w, map[string]any{
		"data":       eventTypes,
		"pagination": pagination,
		"message":    "Successfully fetched event types.",
	})
}

func (handlers *Handlers) CreateEventTypeSettings(w http.ResponseWriter, r *http.Request) {
	var req EventTypeSettingsRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(req); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Validation error")
		return
	}

	// Get user ID from context (set by authentication middleware)
	createdBy := util.GetRequestedUserID(r)
	if createdBy == nil {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
		return
	}

	// Parse the time string to ensure it's in HH:MM format
	_, err := time.Parse("15:04", req.AutoCreateAt)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid time format, expected HH:MM")
		return
	}

	id, err := handlers.eventSvc.EventTypeSettings(r.Context(), event.EventTypeSettingsRequest{
		EventTypeId:                req.EventTypeId,
		AutoCreateAt:               req.AutoCreateAt,
		AutoEventIntervalInMinutes: req.AutoEventIntervalInMinutes,
		RequestBy:                  *createdBy,
		IsActive:                   req.IsActive,
	})

	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Event Type settings created successfully",
		"data":    id,
	})
}

func (handlers *Handlers) GetEventTypeSettings(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.GetIntPathParam(r, "id", w)
	if !ok {
		return
	}

	eventTypeSettings, err := handlers.eventSvc.GetEventTypeSettings(r.Context(), id)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}

	utils.SendData(w, map[string]any{
		"data":    eventTypeSettings,
		"message": "Successfully fetched event type settings.",
	})
}

func (handlers *Handlers) UpdateEventTypeStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.GetIntPathParam(r, "id", w)
	if !ok {
		return
	}

	var request EventTypeStatusChangeRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(request); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Validation error")
		return
	}

	err := handlers.eventSvc.UpdateEventTypeStatus(r.Context(), id, fmt.Sprintf("%s", request.Status))
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Successfully updated event type status.",
	})
}

func (handlers *Handlers) GetEventTypeDetails(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.GetIntPathParam(r, "id", w)
	if !ok {
		return // Error response already handled by GetIntPathParam
	}

	response, err := handlers.eventSvc.GetEventTypeDetails(r.Context(), id)
	if err != nil {
		logger.Error("failed to fetch event type details.", logger.Extra(map[string]any{
			"id":  id,
			"err": err.Error(),
		}))

		if err == util.ErrNotFound {
			utils.SendError(w, http.StatusNotFound, "Event type details not found.")
			return
		}
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch event type details. Please try again later.")
		return
	}

	utils.SendData(w, map[string]any{
		"data":    response,
		"message": "Successfully fetched event type details.",
	})
}
