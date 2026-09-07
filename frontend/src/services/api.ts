import axios, { AxiosResponse } from 'axios';
import { config } from '../config/env';
import { attachAuthInterceptors } from './interceptors';

const API_BASE_URL = config.apiBaseUrl;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT bearer header + 401 refresh/retry + force-logout on expired sessions
attachAuthInterceptors(axiosInstance);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GetUserPermissionsResponse {
  data: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  message: string;
  status: string;
}

export interface GetEventsParams {
  title?: string;
  mode?: 'ALL' | 'ONGOING' | 'UPCOMING' | 'RECENT';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface Event {
  id: number;
  title: string;
  description: string;
  startAt: string; // ISO date string
  registrationOpensAt: string;
  registrationClosesAt: string;
  maxParticipants: number;
  totalParticipants: number;
  status: string;
}

export interface Participation {
  eventId: number;
  eventTitle: string;
  eventType: string;
  eventStartTime: string;
  guestCount: number;
  status: string;
  remarks?: string;
  createdAt: string;
}

interface EventsResponse {
  data: Event[];
  pagination: {
    totalItem: number;
    page: number;
    limit: number;
    totalPage: number;
  };
}

interface ParticipationsResponse {
  data: Participation[];
  pagination: {
    totalItem: number;
    page: number;
    limit: number;
    totalPage: number;
  };
}

export interface RegisterEventRequest {
  action: 'REGISTER';
  guestCount: number;
}

export const apiClient = {
  // Generic GET method
  get: <T>(url: string, params?: any): Promise<AxiosResponse<T>> => {
    return axiosInstance.get<T>(url, { params });
  },
  login: (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> =>
    axiosInstance.post('/api/v1/login', data),

  getEvents: (params: GetEventsParams = {}): Promise<AxiosResponse<EventsResponse>> => {
    const searchParams = new URLSearchParams();

    if (params.title) searchParams.append('title', params.title);
    if (params.mode) searchParams.append('status', params.mode);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    return axiosInstance.get(`/api/v1/events?${searchParams.toString()}`);
  },

  getPublicEvents: (params: GetEventsParams = {}): Promise<AxiosResponse<EventsResponse>> => {
    const searchParams = new URLSearchParams();

    if (params.title) searchParams.append('title', params.title);
    if (params.mode) searchParams.append('status', params.mode);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    return axiosInstance.get(`/api/v1/public/events?${searchParams.toString()}`);
  },

  getParticipations: (params: any = {}): Promise<AxiosResponse<ParticipationsResponse>> => {
    return axiosInstance.get('/api/v1/event/participations', { params });
  },

  registerForEvent: (eventId: number, data: RegisterEventRequest): Promise<AxiosResponse<any>> =>
    axiosInstance.post(`/v1/events/${eventId}/register`, data),

  refreshToken: (refreshToken: string): Promise<AxiosResponse<{ accessToken: string }>> =>
    axiosInstance.get(`/api/v1/token/refresh?token=${refreshToken}`),

  getUserPermissions: (): Promise<AxiosResponse<GetUserPermissionsResponse>> =>
    axiosInstance.get('/api/v1/users/me/permissions'),

  completeGoogleAuth: (provider: string, code: string, state: string): Promise<AxiosResponse<LoginResponse>> =>
    axiosInstance.get(`/auth/${provider}/callback?code=${code}&state=${state}`, {
      withCredentials: true,
    }),

  participateInEvent: (eventId: number, guestCount: number = 0): Promise<AxiosResponse<any>> =>
    axiosInstance.post('/api/v1/event/participate', {
      eventId,
      guestCount,
      // userId is required by validation but backend takes it from context
      userId: 1,
    }),
  updateParticipationStatus: (eventId: number, status: 'GOING' | 'CANCELED', remarks: string = ''): Promise<AxiosResponse<any>> =>
    axiosInstance.put('/api/v1/event/participations/update-status', {
      event_id: eventId,
      status,
      remarks,
    }),
  updateGuestCount: (eventId: number, guestCount: number): Promise<AxiosResponse<any>> =>
    axiosInstance.put('/api/v1/event/participations/update-guest-count', {
      event_id: eventId,
      guest_count: guestCount,
    }),
};