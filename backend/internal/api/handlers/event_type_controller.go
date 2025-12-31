package handlers

import (
	"encoding/json"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/event"
	"identity-rbac/internal/util"
	"net/http"
)

type CreateEventTypeRequest struct {
	Name        string `json:"name" validation:"required"`
	Description string `json:"description"`
}

type GetEventTypes struct {
	Name  string `json:"name"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
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
		utils.SendError(w, http.StatusBadRequest, "Failed to extract query params")
		return
	}

	utils.SendData(w, map[string]any{
		"data":       eventTypes,
		"pagination": pagination,
		"message":    "Successfully fetched event types.",
	})
}
