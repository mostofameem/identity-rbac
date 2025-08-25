export interface Event {
  id: number;
  title: string;
  description?: string; // Made optional since it's not in your API response
  startAt: string;
  endAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  eventType: string; // Changed from eventTypeId to eventType to match API
  eventTypeId: number;
  status: 'REGISTERED' | 'NOT_REGISTERED' | 'CANCELED'; // Changed from registrationStatus to status
  guestCount: number;
  createdBy?: number; // Made optional since it's not in your API response
  createdAt?: string; // Made optional since it's not in your API response
  isActive?: boolean; // Made optional since it's not in your API response
}

export interface EventsResponse {
  data: Event[]; // Changed from events to data to match API response
  pagination: {
    totalItem: number;
    totalPage: number;
    currentPage: number;
  }; // Changed from totalPage to pagination object
}

export interface RegisterEventRequest {
  action: 'REGISTER' | 'CANCEL' | 'NOT_REGISTERED';
  guestCount: number;
}

export interface EventFilters {
  mode?: 'ALL' | 'ONGOING' | 'UPCOMING' | 'RECENT';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
} 