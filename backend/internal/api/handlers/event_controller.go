package handlers

import (
	"encoding/json"
	"errors"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/event"
	"identity-rbac/internal/util"
	"log"
	"net/http"
	"time"
)

type CreateEventRequest struct {
	Title                string     `json:"title" validation:"required"`
	Description          string     `json:"description"`
	EventTypeId          int        `json:"eventTypeId" validation:"required"`
	StartAt              time.Time  `json:"startAt" validation:"required"`
	RegistrationOpensAt  *time.Time `json:"registrationOpensAt"`
	RegistrationClosesAt *time.Time `json:"registrationClosesAt"`
}

func (handlers *Handlers) CreateEvent(w http.ResponseWriter, r *http.Request) {
	var createEventReq CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&createEventReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(createEventReq); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Validation error")
		return
	}

	// Get user ID from context (set by authentication middleware)
	createdBy, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
		return
	}

	// Prepare service request
	serviceReq := event.CreateEventReq{
		Title:                createEventReq.Title,
		Description:          createEventReq.Description,
		EventTypeId:          createEventReq.EventTypeId,
		StartAt:              createEventReq.StartAt,
		RegistrationOpensAt:  createEventReq.RegistrationOpensAt,
		RegistrationClosesAt: createEventReq.RegistrationClosesAt,
		CreatedBy:            createdBy,
		CreatedAt:            util.GetCurrentTime(),
	}

	// Call event service
	createdEvent, err := handlers.eventSvc.CreateEvent(r.Context(), serviceReq)
	if err != nil {
		if errors.Is(err, util.ErrNotFound) {
			utils.SendError(w, http.StatusNotFound, "Event type not found")
			return
		}
		log.Printf("Failed to create event: %v\n", err)
		utils.SendError(w, http.StatusInternalServerError, "Failed to create event")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Event created successfully",
		"data":    createdEvent,
	})
}
