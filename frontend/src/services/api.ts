import axios, { AxiosResponse } from 'axios';
import { config } from '../config/env';

const API_BASE_URL = config.apiBaseUrl;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
axiosInstance.interceptors.request.use(
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

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('🔄 Token expired, attempting refresh...');

          // Backend expects GET request with query parameter
          const response = await axios.get(`${API_BASE_URL}/api/v1/token/refresh?token=${refreshToken}`);

          const { accessToken } = response.data;
          localStorage.setItem('token', accessToken);

          console.log('✅ Token refreshed successfully');

          // Update the authorization header and retry the request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } else {
          console.log('❌ No refresh token available');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Only redirect to login if refresh token is invalid
        // For access denied errors, let the component handle it
        if ((refreshError as any).response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // For 403 (Forbidden) or other authorization errors, don't redirect to login
    // Let the component handle the error gracefully
    if (error.response?.status === 403) {
      console.log('❌ Access denied - insufficient permissions');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

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

    if (params.mode) searchParams.append('status', params.mode);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    return axiosInstance.get(`/api/v1/events?${searchParams.toString()}`);
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
};