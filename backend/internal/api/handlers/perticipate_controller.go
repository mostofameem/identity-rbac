package handlers

import (
	"encoding/json"
	"errors"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/event"
	"identity-rbac/internal/util"
	"net/http"
	"time"
)

func (handlers *Handlers) PerticipateEvent(w http.ResponseWriter, r *http.Request) {
	var request PerticipateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	// Get user ID from context (set by authentication middleware)
	createdBy, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
		return
	}

	// Prepare service request
	serviceReq := event.PerticipateEventReq{
		EventId:     request.EventId,
		UserId:      createdBy,
		GuestCount:  request.GuestCount,
		CurrentTime: util.GetCurrentTime(),
	}

	// Call event service
	err := handlers.eventSvc.PerticipateEvent(r.Context(), serviceReq)
	if err != nil {
		if errors.Is(err, util.ErrSomethingWentWrong) {
			utils.SendError(w, http.StatusInternalServerError, "Failed to perticipate event")
			return
		}

		utils.SendError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Event Perticipated successfully",
	})
}

func (handlers *Handlers) GetMyEventPerticipations(w http.ResponseWriter, r *http.Request) {

	request := utils.GetPaginationParams(r)
	// Get user ID from context (set by authentication middleware)
	userId, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
		return
	}

	// Call event service
	var queryFrom, queryTo *time.Time
	if vals, ok := request.Filters["queryFrom"]; ok && len(vals) > 0 {
		if t, err := time.Parse("2006-01-02", vals[0]); err == nil {
			queryFrom = &t
		}
	}
	if vals, ok := request.Filters["queryTo"]; ok && len(vals) > 0 {
		if t, err := time.Parse("2006-01-02", vals[0]); err == nil {
			queryTo = &t
		}
	}

	events, pagination, err := handlers.eventSvc.MyEventPerticipations(r.Context(), event.GetEventPerticipationsReq{
		UserId:    userId,
		Page:      request.Page,
		Limit:     request.Limit,
		QueryFrom: queryFrom,
		QueryTo:   queryTo,
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
