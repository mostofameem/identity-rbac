export interface EventTypeSetting {
  id: string;
  key: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'select';
  isRequired: boolean;
  eventTypeId?: string;
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  requiresApproval: boolean;
  maxParticipants?: number;
  settings?: EventTypeSetting[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // For any additional properties
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startAt: string | Date;
  registrationOpensAt: string | Date;
  registrationClosesAt: string | Date;
  maxParticipants?: number;
  shouldAutoCreateEvent?: boolean;
  isActive?: boolean;
  status?: 'draft' | 'published' | 'cancelled' | 'completed' | 'active' | 'upcoming' | 'ONGOING' | 'UPCOMING' | 'RECENT' | 'ENDED' | 'INACTIVE' | 'ACTIVE';
  eventTypeId: string;
  eventType?: EventType;
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // For any additional properties
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  eventTypeId?: string;
}

export interface ParticipationDetail {
  userEmail: string;
  guestCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  remarks: string | null;
}

export interface ParticipationQueryParams {
  page?: number;
  limit?: number;
  email?: string;
}

