import axios, { AxiosResponse } from 'axios';
import { Event, EventsResponse } from '../types/events';

const API_BASE_URL = 'http://localhost:5001'; // Backend running on port 5001

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
          // Backend expects GET request with query parameter
          const response = await axios.get(`${API_BASE_URL}/v1/token/refresh?token=${refreshToken}`);

          const { accessToken } = response.data;
          localStorage.setItem('token', accessToken);

          // Update the authorization header and retry the request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token is invalid, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  permissions: string[];
}

export interface GetEventsParams {
  mode?: 'ALL' | 'ONGOING' | 'UPCOMING' | 'RECENT';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface RegisterEventRequest {
  action: 'REGISTER';
  guestCount: number;
}

export const apiClient = {
  login: (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> =>
    axiosInstance.post('/v1/login', data),

  getEvents: (params: GetEventsParams = {}): Promise<AxiosResponse<EventsResponse>> => {
    const searchParams = new URLSearchParams();
    
    if (params.mode) searchParams.append('mode', params.mode);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    return axiosInstance.get(`/v1/events?${searchParams.toString()}`);
  },

  registerForEvent: (eventId: number, data: RegisterEventRequest): Promise<AxiosResponse<any>> =>
    axiosInstance.post(`/v1/events/${eventId}/register`, data),

  refreshToken: (refreshToken: string): Promise<AxiosResponse<{ accessToken: string }>> =>
    axiosInstance.get(`/v1/token/refresh?token=${refreshToken}`),
}; 