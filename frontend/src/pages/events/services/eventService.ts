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
      const queryParams: any = {};
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.search) queryParams.name = params.search;
      
      const response = await api.get('/event-types', { params: queryParams });
      // Backend returns {data: [], pagination: {totalItem, totalPage, currentPage}}
      const backendData = response.data.data || [];
      const pagination = response.data.pagination || {};
      
      return {
        data: backendData.map((et: any) => ({
          id: et.id.toString(),
          name: et.name,
          description: et.description,
          isActive: true,
          requiresApproval: false,
        })),
        total: pagination.totalItem || 0,
        page: pagination.currentPage || 1,
        limit: params.limit || 10,
        totalPages: pagination.totalPage || 1,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  getEventType: async (id: string): Promise<EventType> => {
    try {
      const response = await api.get(`/event-types/${id}`);
      const data = response.data.data || response.data;
      return {
        id: data.id.toString(),
        name: data.name,
        description: data.description,
        isActive: data.isActive !== false,
        requiresApproval: false,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  createEventType: async (data: Partial<EventType>): Promise<EventType> => {
    try {
      // Backend expects only name and description
      const payload = {
        name: data.name,
        description: data.description || '',
      };
      const response = await api.post('/event-types', payload);
      const responseData = response.data.data || response.data;
      return {
        id: responseData.toString() || Date.now().toString(),
        name: data.name || '',
        description: data.description || '',
        isActive: true,
        requiresApproval: false,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateEventType: async (id: string, data: Partial<EventType>): Promise<EventType> => {
    try {
      // Backend doesn't have update endpoint, but keeping for compatibility
      const response = await api.put(`/event-types/${id}`, data);
      return response.data.data || response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteEventType: async (id: string): Promise<void> => {
    try {
      // Backend doesn't have delete endpoint, but keeping for compatibility
      await api.delete(`/event-types/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Event Type Settings
  getEventTypeSettings: async (eventTypeId: string): Promise<EventTypeSetting[]> => {
    try {
      const response = await api.get(`/event-types/settings/${eventTypeId}`);
      const data = response.data.data || response.data;
      // Handle both array and single object response
      if (Array.isArray(data)) {
        return data.map((s: any) => ({
          id: s.id?.toString() || s.eventTypeId?.toString() || '',
          key: s.key || '',
          value: s.value?.toString() || s.autoCreateAt || '',
          dataType: s.dataType || 'string',
          isRequired: s.isRequired || false,
          eventTypeId: eventTypeId,
        }));
      }
      return [{
        id: data.id?.toString() || eventTypeId,
        key: 'autoCreateAt',
        value: data.autoCreateAt || '',
        dataType: 'string' as const,
        isRequired: true,
        eventTypeId: eventTypeId,
      }];
    } catch (error) {
      return handleApiError(error);
    }
  },

  createEventTypeSetting: async (data: Partial<EventTypeSetting>): Promise<EventTypeSetting> => {
    try {
      // Backend expects: eventTypeId, autoCreateAt (HH:MM), autoEventIntervalInMinutes, isActive
      const payload = {
        eventTypeId: parseInt(data.eventTypeId || '0'),
        autoCreateAt: data.value || '09:00',
        autoEventIntervalInMinutes: parseInt(data.value?.toString() || '1440'), // Default 24 hours
        isActive: data.isRequired || true,
      };
      const response = await api.put('/event-types/settings', payload);
      const responseData = response.data.data || response.data;
      return {
        id: responseData.toString() || Date.now().toString(),
        key: data.key || 'autoCreateAt',
        value: payload.autoCreateAt,
        dataType: 'string' as const,
        isRequired: payload.isActive,
        eventTypeId: data.eventTypeId,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateEventTypeSetting: async (id: string, data: Partial<EventTypeSetting>): Promise<EventTypeSetting> => {
    try {
      // Backend uses PUT for both create and update
      const payload = {
        eventTypeId: parseInt(data.eventTypeId || id),
        autoCreateAt: data.value || '09:00',
        autoEventIntervalInMinutes: 1440,
        isActive: data.isRequired !== false,
      };
      const response = await api.put('/event-types/settings', payload);
      return {
        id: id,
        key: data.key || 'autoCreateAt',
        value: payload.autoCreateAt,
        dataType: 'string' as const,
        isRequired: payload.isActive,
        eventTypeId: data.eventTypeId || id,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteEventTypeSetting: async (id: string): Promise<void> => {
    try {
      // Backend doesn't have delete endpoint for settings
      console.warn('Delete event type settings not supported by backend');
    } catch (error) {
      handleApiError(error);
    }
  },
};

// Event Services
export const eventService = {
  getEvents: async (params: ListQueryParams = {}): Promise<PaginatedResponse<Event>> => {
    try {
      const queryParams: any = {};
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.search) queryParams.title = params.search;
      if (params.eventTypeId) queryParams.typeId = params.eventTypeId;
      if (params.status) queryParams.status = params.status;
      
      const response = await api.get('/events', { params: queryParams });
      // Backend returns {data: [], pagination: {totalItem, totalPage, currentPage}}
      const backendData = response.data.data || [];
      const pagination = response.data.pagination || {};
      
      return {
        data: backendData.map((e: any) => ({
          id: e.id.toString(),
          title: e.title,
          description: e.description,
          startAt: e.startAt,
          registrationOpensAt: e.registrationOpensAt,
          registrationClosesAt: e.registrationClosesAt,
          maxParticipants: e.maxParticipants || e.totalParticipants || 0,
          totalParticipants: e.totalParticipants || 0,
          status: e.status || 'upcoming',
          eventTypeId: e.eventTypeId?.toString() || e.eventType?.id?.toString() || '',
          eventType: e.eventType ? {
            id: e.eventType.id?.toString() || '',
            name: e.eventType.name || e.eventType,
            description: e.eventType.description,
            isActive: true,
            requiresApproval: false,
          } : undefined,
        })),
        total: pagination.totalItem || 0,
        page: pagination.currentPage || 1,
        limit: params.limit || 10,
        totalPages: pagination.totalPage || 1,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  getEvent: async (id: string): Promise<Event> => {
    try {
      const response = await api.get(`/event/${id}`);
      const data = response.data.data || response.data;
      return {
        id: data.id.toString(),
        title: data.title,
        description: data.description,
        startAt: data.startAt,
        registrationOpensAt: data.registrationOpensAt,
        registrationClosesAt: data.registrationClosesAt,
        maxParticipants: data.maxParticipants || 0,
        status: data.status || 'upcoming',
        eventTypeId: data.eventTypeId?.toString() || '',
        eventType: data.eventType ? {
          id: data.eventType.id?.toString() || '',
          name: data.eventType.name || '',
          description: data.eventType.description,
          isActive: true,
          requiresApproval: false,
        } : undefined,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  createEvent: async (data: Partial<Event>): Promise<Event> => {
    try {
      // Backend expects: title, description, eventTypeId, startAt, registrationOpensAt, registrationClosesAt, maxParticipants
      const payload = {
        title: data.title,
        description: data.description || '',
        eventTypeId: parseInt(data.eventTypeId as string),
        startAt: typeof data.startAt === 'string' ? data.startAt : (data.startAt as Date).toISOString(),
        registrationOpensAt: typeof data.registrationOpensAt === 'string' 
          ? data.registrationOpensAt 
          : (data.registrationOpensAt as Date).toISOString(),
        registrationClosesAt: typeof data.registrationClosesAt === 'string'
          ? data.registrationClosesAt
          : (data.registrationClosesAt as Date).toISOString(),
        maxParticipants: parseInt((data.maxParticipants || 0).toString()),
      };
      const response = await api.post('/events', payload);
      const responseData = response.data.data || response.data;
      return {
        id: responseData.id?.toString() || Date.now().toString(),
        title: data.title || '',
        description: data.description || '',
        startAt: data.startAt as Date,
        registrationOpensAt: data.registrationOpensAt as Date,
        registrationClosesAt: data.registrationClosesAt as Date,
        maxParticipants: data.maxParticipants || 0,
        eventTypeId: data.eventTypeId as string,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    try {
      // Backend doesn't have update endpoint, but keeping for compatibility
      const response = await api.put(`/events/${id}`, data);
      return response.data.data || response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteEvent: async (id: string): Promise<void> => {
    try {
      // Backend doesn't have delete endpoint, but keeping for compatibility
      await api.delete(`/events/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  participateInEvent: async (eventId: string, data: any = {}): Promise<void> => {
    try {
      await api.post('/event/participate', { 
        eventId: parseInt(eventId),
        guestCount: data.guestCount || 0,
      });
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default {
  eventType: eventTypeService,
  event: eventService,
};
