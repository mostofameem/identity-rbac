import axios from 'axios';
import { config } from '../../../config/env';
import { attachAuthInterceptors } from '../../../services/interceptors';
import {
  Event,
  EventType,
  EventTypeSetting,
  PaginatedResponse,
  ListQueryParams,
  ParticipationDetail,
  ParticipationQueryParams,
  Recurrence
} from '../types/event.types';


const API_BASE_URL = `${config.apiBaseUrl}/api/v1`;

// Create axios instance with base URL and common headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT bearer header + 401 refresh/retry + force-logout on expired sessions
attachAuthInterceptors(api);

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
          isActive: et.isActive !== false,
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


  deleteEventType: async (id: string): Promise<void> => {
    try {
      // Backend doesn't have delete endpoint, but keeping for compatibility
      await api.delete(`/event-types/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  changeEventTypeStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    try {
      await api.put(`/event-type/${id}/change-status`, { status });
    } catch (error) {
      handleApiError(error);
    }
  },

  getEventTypeSettings: async (eventTypeId: string): Promise<any> => {
    try {
      const response = await api.get(`/event-types/settings/${eventTypeId}`);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      return handleApiError(error);
    }
  },

  createEventTypeSetting: async (data: {
    eventTypeId: string;
    autoCreateAt: string;
    recurrence: Recurrence;
    isActive: boolean;
  }): Promise<any> => {
    try {
      const payload = {
        eventTypeId: parseInt(data.eventTypeId),
        autoCreateAt: data.autoCreateAt,
        recurrence: data.recurrence,
        isActive: data.isActive,
      };

      const response = await api.put('/event-types/settings', payload);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateEventTypeSetting: async (data: {
    eventTypeId: string;
    autoCreateAt: string;
    recurrence: Recurrence;
    isActive: boolean;
  }): Promise<any> => {
    try {
      // Backend uses PUT for both create and update
      const payload = {
        eventTypeId: parseInt(data.eventTypeId),
        autoCreateAt: data.autoCreateAt,
        recurrence: data.recurrence,
        isActive: data.isActive,
      };
      const response = await api.put('/event-types/settings', payload);
      return response.data;
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
          isActive: e.isActive,
          shouldAutoCreateEvent: e.shouldAutoCreateEvent,
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
      const response = await api.get(`/events/${id}`);
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
        isActive: data.isActive,
        shouldAutoCreateEvent: data.shouldAutoCreateEvent,
        remarks: data.remarks ?? null,
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

  changeEventStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    try {
      await api.put(`/events/${id}/change-status`, { status });
    } catch (error) {
      handleApiError(error);
    }
  },

  getEventParticipants: async (eventId: string, params: ParticipationQueryParams = {}): Promise<PaginatedResponse<ParticipationDetail>> => {
    try {
      const queryParams: any = {};
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.email) queryParams.email = params.email;

      const response = await api.get(`/events/${eventId}/participants`, { params: queryParams });
      const backendData = response.data.data || [];
      const pagination = response.data.pagination || {};

      return {
        data: backendData,
        total: pagination.totalItem || 0,
        page: pagination.currentPage || 1,
        limit: params.limit || 50,
        totalPages: pagination.totalPage || 1,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateShouldAutoCreateEvent: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    try {
      await api.put(`/events/${id}/update-should-auto-create-event`, { status });
    } catch (error) {
      handleApiError(error);
    }
  },

  getEventOccurrences: async (id: string): Promise<any> => {
    try {
      const response = await api.get(`/events/${id}/occurrences`);
      return response.data?.data ?? response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};


const services = {
  eventType: eventTypeService,
  event: eventService,
};

export default services;
