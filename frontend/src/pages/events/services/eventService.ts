import axios from 'axios';
import { config } from '../../../config/env';
import {
  Event,
  EventType,
  EventTypeSetting,
  PaginatedResponse,
  ListQueryParams
} from '../types/event.types';

const API_BASE_URL = `${config.apiBaseUrl}/api/v1`;

// Create axios instance with base URL and common headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    throw new Error(error.response.data.message || 'Something went wrong');
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error(error.message || 'Something went wrong');
  }
};

// Event Type Services
export const eventTypeService = {
  getEventTypes: async (params: ListQueryParams = {}): Promise<PaginatedResponse<EventType>> => {
    try {
      const response = await api.get('/event-types', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getEventType: async (id: string): Promise<EventType> => {
    try {
      const response = await api.get(`/event-types/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createEventType: async (data: Partial<EventType>): Promise<EventType> => {
    try {
      const response = await api.post('/event-types', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateEventType: async (id: string, data: Partial<EventType>): Promise<EventType> => {
    try {
      const response = await api.put(`/event-types/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteEventType: async (id: string): Promise<void> => {
    try {
      await api.delete(`/event-types/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Event Type Settings
  getEventTypeSettings: async (eventTypeId: string): Promise<EventTypeSetting[]> => {
    try {
      const response = await api.get(`/event-types/settings/${eventTypeId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createEventTypeSetting: async (data: Partial<EventTypeSetting>): Promise<EventTypeSetting> => {
    try {
      const response = await api.post('/event-types/settings', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateEventTypeSetting: async (id: string, data: Partial<EventTypeSetting>): Promise<EventTypeSetting> => {
    try {
      const response = await api.put(`/event-types/settings/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteEventTypeSetting: async (id: string): Promise<void> => {
    try {
      await api.delete(`/event-types/settings/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

// Event Services
export const eventService = {
  getEvents: async (params: ListQueryParams = {}): Promise<PaginatedResponse<Event>> => {
    try {
      const response = await api.get('/events', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getEvent: async (id: string): Promise<Event> => {
    try {
      const response = await api.get(`/event/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createEvent: async (data: Partial<Event>): Promise<Event> => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        eventTypeId: parseInt(data.eventTypeId as string),
        startAt: data.startAt,
        registrationOpensAt: data.registrationOpensAt,
        registrationClosesAt: data.registrationClosesAt,
        maxParticipants: parseInt(data.maxParticipants as any),
      };
      const response = await api.post('/events', payload);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    try {
      const response = await api.put(`/events/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteEvent: async (id: string): Promise<void> => {
    try {
      await api.delete(`/events/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  participateInEvent: async (eventId: string, data: any = {}): Promise<void> => {
    try {
      await api.post('/event/participate', { eventId, ...data });
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default {
  eventType: eventTypeService,
  event: eventService,
};
