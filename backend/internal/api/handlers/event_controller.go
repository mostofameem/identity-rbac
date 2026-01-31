package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/event"
	"identity-rbac/internal/util"
	"identity-rbac/pkg/logger"
	"log"
	"net/http"
	"time"
)

type CreateEventRequest struct {
	Title                string     `json:"title"                validation:"required"`
	Description          string     `json:"description"`
	EventTypeId          int        `json:"eventTypeId"          validation:"required"`
	StartAt              time.Time  `json:"startAt"              validation:"required"`
	RegistrationOpensAt  *time.Time `json:"registrationOpensAt"  validation:"required"`
	RegistrationClosesAt *time.Time `json:"registrationClosesAt" validation:"required"`
	MaxParticipants      int        `json:"maxParticipants"      validation:"required"`
}

type GetEventRequest struct {
	Title       string               `form:"title" json:"title"`
	EventStatus enum.EventStatusType `form:"status" json:"status"`
	Page        int                  `form:"page" json:"page"`
	Limit       int                  `form:"limit" json:"limit"`
}

type PerticipateEventRequest struct {
	EventId    int `json:"eventId" validation:"required,gt=0"`
	UserId     int `json:"userId" validation:"required,gt=0"`
	GuestCount int `json:"guestCount" validation:"required,gte=0,lte=10"` // Added max limit of 10 guests
}

type EventStatusChangeRequest struct {
	Status enum.ActiveInactiveStatus `json:"status" validation:"required"`
}

type GetPublicEventRequest struct {
	Title       string                     `form:"title" json:"title"`
	EventStatus enum.PublicEventStatusType `form:"status" json:"status"`
	Page        int                        `form:"page" json:"page"`
	Limit       int                        `form:"limit" json:"limit"`
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
		Title:                 createEventReq.Title,
		Description:           createEventReq.Description,
		EventTypeId:           createEventReq.EventTypeId,
		StartAt:               createEventReq.StartAt,
		RegistrationOpensAt:   createEventReq.RegistrationOpensAt,
		RegistrationClosesAt:  createEventReq.RegistrationClosesAt,
		ShouldAutoCreateEvent: false,
		MaxParticipants:       createEventReq.MaxParticipants,
		CreatedBy:             &createdBy,
		CreatedAt:             util.GetCurrentTime(),
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

func (handlers *Handlers) GetEvents(w http.ResponseWriter, r *http.Request) {
	var request GetEventRequest

	err := utils.BindValues(&request, r.URL.Query())
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Failed to extract query params")
		return
	}

	events, pagination, err := handlers.eventSvc.GetEvents(r.Context(), event.GetEventsReq{
		Title:       request.Title,
		EventStatus: request.EventStatus,
		Page:        request.Page,
		Limit:       request.Limit,
		CurrentTime: time.Now(),
	})
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}

	utils.SendData(w, map[string]any{
		"data":       events,
		"pagination": pagination,
		"message":    "Successfully fetched events.",
	})
}

func (handlers *Handlers) GetPublicEvents(w http.ResponseWriter, r *http.Request) {
	var request GetPublicEventRequest

	err := utils.BindValues(&request, r.URL.Query())
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Failed to extract query params")
		return
	}

	events, pagination, err := handlers.eventSvc.GetPublicEvents(r.Context(), event.GetPublicEventsReq{
		Title:       request.Title,
		EventStatus: request.EventStatus,
		Page:        request.Page,
		Limit:       request.Limit,
		CurrentTime: time.Now(),
	})
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}

	utils.SendData(w, map[string]any{
		"data":       events,
		"pagination": pagination,
		"message":    "Successfully fetched events.",
	})
}

func (handlers *Handlers) GetEventDetails(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.GetIntPathParam(r, "id", w)
	if !ok {
		return // Error response already handled by GetIntPathParam
	}

	response, err := handlers.eventSvc.GetEventDetails(r.Context(), id)
	if err != nil {
		logger.Error("failed to fetch event details.", logger.Extra(map[string]any{
			"id":  id,
			"err": err.Error(),
		}))

		if err == util.ErrNotFound {
			utils.SendError(w, http.StatusNotFound, "Event details not found.")
			return
		}
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch event details. Please try again later.")
		return
	}

	utils.SendData(w, map[string]any{
		"data":    response,
		"message": "Successfully fetched event details.",
	})
}

func (handlers *Handlers) UpdateEventStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.GetIntPathParam(r, "id", w)
	if !ok {
		return
	}

	var request EventStatusChangeRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := utils.Validate(request); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Validation error")
		return
	}

	err := handlers.eventSvc.UpdateEventStatus(r.Context(), id, fmt.Sprintf("%s", request.Status))
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Successfully updated event type status.",
	})
}
