export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  permissions?: Array<{
    id: number;
    name: string;
  }>;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles?: Role[];
}

export interface EventType {
  id: number;
  name: string;
}

export interface Event {
  id: number;
  title: string;
  eventType: string;
  startAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  status: string;
  guestCount: number;
}

export interface EventFilter {
  title: string;
  typeId: string;
  id: number | undefined;
  startTime: string;
  endTime: string;
  mode: 'ALL' | 'ONGOING' | 'UPCOMING' | 'RECENT';
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export interface Pagination {
  totalItem: number;
  totalPage: number;
  currentPage: number;
}
