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

export type Recurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ONCE';

export const RECURRENCE_OPTIONS: Array<{ value: Recurrence; label: string }> = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONCE', label: 'Once' },
];

export const recurrenceLabel = (value: string): string =>
  RECURRENCE_OPTIONS.find((option) => option.value === value)?.label || value;

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
  shouldAutoCreate?: boolean;
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

