import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const adminAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
adminAxiosInstance.interceptors.request.use(
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
adminAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.get(`${API_BASE_URL}/v1/token/refresh?token=${refreshToken}`);
          const { accessToken } = response.data;
          localStorage.setItem('token', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return adminAxiosInstance(originalRequest);
        }
      } catch (refreshError) {
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

// User Management Types
export interface AddUserRequest {
  email: string;
  roleIds: number[];
}

export interface GetUsersResponse {
  data: Array<{
    id: number;
    email: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

export interface AssignRoleToUserRequest {
  userId: number;
  roleId: number;
}

// Role Management Types
export interface CreateRoleV2Request {
	roleName: string;
	description: string;
	permissionIds: number[];
}

export interface GetRolesResponse {
	data: Array<{
		id: number;
		name: string;
		description: string;
		createdAt: string;
		permissions: Array<{
			id: number;
			name: string;
		}>;
	}>;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
  isActive?: boolean;
}

// Permission Management Types
export interface CreatePermissionRequest {
  permissionName: string;
  description: string;
}

export interface GetPermissionsResponse {
  data: Array<{
    id: number;
    name: string;
    description: string;
    createdAt: string;
  }>;
}

export interface AssignPermissionToRoleRequest {
  roleId: number;
  permissionId: number;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
  isActive?: boolean;
}

// Event Management Types
export interface CreateEventRequest {
  title: string;
  description: string;
  eventTypeId: number;
  eventStartsAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
}

export interface CreateEventTypeRequest {
  name: string;
  description: string;
  autoEventCreate: boolean;
  autoEventCreateInterval: number;
}

export interface GetEventsResponse {
  data: Array<{
    id: number;
    title: string;
    eventType: string;           // Backend sends event type name as string
    startAt: string;            // Backend sends startAt, not eventStartsAt
    registrationOpensAt: string;
    registrationClosesAt: string;
    status: string;             // User participation status
    guestCount: number;         // User's guest count
  }>;
  pagination?: {
    totalItem: number;          // Backend sends totalItem, not total
    totalPage: number;          // Backend sends totalPage, not totalPages
    currentPage: number;        // Backend sends currentPage, not page
  };
}

export interface GetEventTypesResponse {
  data: Array<{
    id: number;
    name: string;
  }>;
}

export interface GetEventFilters {
  title?: string;
  typeId?: string;
  id?: number;
  startTime?: string;
  endTime?: string;
  mode?: 'ALL' | 'ONGOING' | 'UPCOMING' | 'RECENT';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface EventDetailsResponse {
  eventDetails: {
    title: string;
    description: string;
    eventType: string;
    startAt: string;
    registrationOpensAt: string;
    registrationClosesAt: string;
    createdBy: string;
    createdAt: string;
  };
  participantDetails: {
    participants: Array<{
      userEmail: string;
      guestCount: number;
      status: string;
      remarks?: string;
      createdAt: string;
    }> | null;
    totalParticipants: number;
  };
  pagination: {
    totalItem: number;
    totalPage: number;
    currentPage: number;
  };
}

export const adminApiClient = {
  // User Management
  getUsers: (email?: string): Promise<AxiosResponse<GetUsersResponse>> => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    return adminAxiosInstance.get(`/v1/users?${params.toString()}`);
  },

  addUser: (data: AddUserRequest): Promise<AxiosResponse<{ message: string }>> =>
    adminAxiosInstance.post('/v1/users/add', data),

  assignRoleToUser: (data: AssignRoleToUserRequest): Promise<AxiosResponse<{ message: string }>> =>
    adminAxiosInstance.post('/v1/users/assign-role', data),

  // Role Management
  getRoles: (title?: string): Promise<AxiosResponse<GetRolesResponse>> => {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    return adminAxiosInstance.get(`/v1/roles?${params.toString()}`);
  },

  createRoleV2: (data: CreateRoleV2Request): Promise<AxiosResponse<{ message: string }>> =>
    adminAxiosInstance.post('/v1/roles', data),

  updateRole: (roleId: number, data: UpdateRoleRequest): Promise<AxiosResponse<{ message: string }>> =>
    adminAxiosInstance.put(`/v1/roles/${roleId}`, data),

  // Permission Management
  getPermissions: (title?: string): Promise<AxiosResponse<GetPermissionsResponse>> => {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    return adminAxiosInstance.get(`/v1/permissions?${params.toString()}`);
  },

  createPermission: (data: CreatePermissionRequest): Promise<AxiosResponse<{ message: string }>> =>
    adminAxiosInstance.post('/v1/permissions', data),

  assignPermissionToRole: (data: AssignPermissionToRoleRequest): Promise<AxiosResponse<{ message: string }>> =>
    adminAxiosInstance.post('/v1/roles/assign-permission', data),

  // Event Management
  getEvents: (filters: GetEventFilters = {}): Promise<AxiosResponse<GetEventsResponse>> => {
    const params = new URLSearchParams();
    
    // Always set mode to ALL as default
    params.append('mode', filters.mode || 'ALL');
    
    if (filters.title) params.append('title', filters.title);
    if (filters.typeId) params.append('typeId', filters.typeId);
    if (filters.id) params.append('id', filters.id.toString());
    if (filters.startTime) params.append('startTime', filters.startTime);
    if (filters.endTime) params.append('endTime', filters.endTime);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return adminAxiosInstance.get(`/v1/events?${params.toString()}`);
  },

  createEvent: (data: CreateEventRequest): Promise<AxiosResponse<{ message: string }>> =>
    adminAxiosInstance.post('/v1/events', data),

  getEventTypes: (name?: string): Promise<AxiosResponse<GetEventTypesResponse>> => {
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    return adminAxiosInstance.get(`/v1/event-types?${params.toString()}`);
  },

  createEventType: (data: CreateEventTypeRequest): Promise<AxiosResponse<{ message: string }>> =>
    adminAxiosInstance.post('/v1/event-types', data),

  // Event Details
  getEventDetails: (eventId: number): Promise<AxiosResponse<EventDetailsResponse>> => {
    const params = new URLSearchParams();
    params.append('statusMode', 'ALL');
    return adminAxiosInstance.get(`/v1/events/${eventId}/details?${params.toString()}`);
  },
}; 