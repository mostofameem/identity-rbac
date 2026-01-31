package handlers

import (
	"encoding/json"
	"errors"
	"identity-rbac/internal/api/middlewares"
	"identity-rbac/internal/api/utils"
	"identity-rbac/internal/enum"
	"identity-rbac/internal/event"
	"identity-rbac/internal/util"
	"net/http"
	"time"
)

type UpdateParticipationStatusReq struct {
	EventId int                        `json:"event_id"`
	Status  enum.PerticepateStatusType `json:"status"`
}

type UpdateGuestCountReq struct {
	EventId    int `json:"event_id"`
	GuestCount int `json:"guest_count" validation:"required,gte=0,lte=7"`
}

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

func (handlers *Handlers) UpdatePerticipationStatus(w http.ResponseWriter, r *http.Request) {
	var request UpdateParticipationStatusReq
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	// Get user ID from context (set by authentication middleware)
	userId, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
		return
	}

	//rate limiting
	key := handlers.rateLimiterSvc.GetParticipationKey(userId)
	isAllowed, err := handlers.rateLimiterSvc.IsAllowed(r.Context(), key)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}
	if !isAllowed {
		utils.SendError(w, http.StatusTooManyRequests, "Too many requests, please try again later.")
		return
	}

	// Prepare service request
	serviceReq := event.UpdatePerticipationStatusReq{
		EventId:     request.EventId,
		UserId:      userId,
		Status:      request.Status,
		CurrentTime: util.GetCurrentTime(),
	}

	// Call event service
	err = handlers.eventSvc.UpdatePerticipation(r.Context(), serviceReq)
	if err != nil {
		if errors.Is(err, util.ErrSomethingWentWrong) {
			utils.SendError(w, http.StatusInternalServerError, "Failed to update perticipation")
			return
		}

		utils.SendError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Perticipation updated successfully",
	})
}

func (handlers *Handlers) UpdateGuestCount(w http.ResponseWriter, r *http.Request) {
	var request UpdateGuestCountReq
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	// Get user ID from context (set by authentication middleware)
	userId, ok := r.Context().Value(middlewares.UidKey).(int)
	if !ok {
		utils.SendError(w, http.StatusUnauthorized, "Unauthorized, user not found")
		return
	}

	//rate limiting
	key := handlers.rateLimiterSvc.GetGuestCountKey(userId)
	isAllowed, err := handlers.rateLimiterSvc.IsAllowed(r.Context(), key)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Something went wrong, please try again.")
		return
	}
	if !isAllowed {
		utils.SendError(w, http.StatusTooManyRequests, "Too many requests, please try again later.")
		return
	}

	// Call event service
	err = handlers.eventSvc.UpdateGuestCount(r.Context(), userId, request.EventId, request.GuestCount)
	if err != nil {
		if errors.Is(err, util.ErrSomethingWentWrong) {
			utils.SendError(w, http.StatusInternalServerError, "Failed to update guest count")
			return
		}

		utils.SendError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.SendData(w, map[string]any{
		"message": "Guest count updated successfully",
	})
}
