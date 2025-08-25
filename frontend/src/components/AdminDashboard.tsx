import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManagement from './UserManagement';
import EventManagement from './EventManagement';
import RoleManagement from './RoleManagement';
import PermissionManagement from './PermissionManagement';
import { adminApiClient, EventDetailsResponse, GetEventFilters } from '../services/adminApi';
import './AdminDashboard.css';

// Types
interface User {
  id: number;
  email: string;
  roles?: Role[];
}

interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  isActive?: boolean;
  permissions?: Array<{
    id: number;
    name: string;
  }>;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

interface Event {
  id: number;
  title: string;
  eventType: string;
  startAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  status: string;
  guestCount: number;
}

interface EventType {
  id: number;
  name: string;
  description: string;
  autoEventCreate: boolean;
  autoEventCreateInterval: number;
}

interface Pagination {
  currentPage: number;
  limit: number;
  totalItem: number;
  totalPage: number;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ email: '', roleIds: [] as number[] });
  const [userFilter, setUserFilter] = useState('');

  // Role Management State
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [newRoleV2, setNewRoleV2] = useState({ name: '', description: '', permissionIds: [] as number[] });

  // Role Edit State
  const [showRoleEditModal, setShowRoleEditModal] = useState(false);
  const [editRole, setEditRole] = useState<{ id: number | null; name: string; description: string; isActive: boolean; permissionIds: number[] }>({
    id: null,
    name: '',
    description: '',
    isActive: true,
    permissionIds: []
  });
  const [permissionSearchForEdit, setPermissionSearchForEdit] = useState('');
  const [searchedPermissionsForEdit, setSearchedPermissionsForEdit] = useState<Permission[]>([]);
  const [isSearchingPermissionsForEdit, setIsSearchingPermissionsForEdit] = useState(false);
  const [showPermissionForEditDropdown, setShowPermissionForEditDropdown] = useState(false);

  // Permission Management State
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionFilter, setPermissionFilter] = useState('');
  const [newPermission, setNewPermission] = useState({ name: '', description: '' });

  // Event Management State
  const [events, setEvents] = useState<Event[]>([]);
  const [eventFilter, setEventFilter] = useState<GetEventFilters>({});
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventTypeId: '',
    eventStartsAt: '',
    registrationOpensAt: '',
    registrationClosesAt: ''
  });
  const [selectedEvent, setSelectedEvent] = useState<EventDetailsResponse | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, limit: 10, totalItem: 0, totalPage: 0 });

  // Event Type Management State
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [newEventType, setNewEventType] = useState({
    name: '',
    description: '',
    autoEventCreate: false,
    autoEventCreateInterval: 0
  });

  // Search and Assignment State
  const [permissionSearch, setPermissionSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [userRoleSearch, setUserRoleSearch] = useState('');
  const [roleSearchForUser, setRoleSearchForUser] = useState('');
  const [permissionSearchForRole, setPermissionSearchForRole] = useState('');

  // Dropdown State
  const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showUserRoleDropdown, setShowUserRoleDropdown] = useState(false);
  const [showRoleForUserDropdown, setShowRoleForUserDropdown] = useState(false);
  const [showPermissionForRoleDropdown, setShowPermissionForRoleDropdown] = useState(false);

  // Search Results State
  const [searchedPermissions, setSearchedPermissions] = useState<Permission[]>([]);
  const [searchedRoles, setSearchedRoles] = useState<Role[]>([]);
  const [searchedUsersForRole, setSearchedUsersForRole] = useState<User[]>([]);
  const [searchedRolesForUser, setSearchedRolesForUser] = useState<Role[]>([]);
  const [searchedPermissionsForRole, setSearchedPermissionsForRole] = useState<Permission[]>([]);

  // Loading States
  const [isSearchingPermissions, setIsSearchingPermissions] = useState(false);
  const [isSearchingRoles, setIsSearchingRoles] = useState(false);
  const [isSearchingUsersForRole, setIsSearchingUsersForRole] = useState(false);
  const [isSearchingRolesForUser, setIsSearchingRolesForUser] = useState(false);
  const [isSearchingPermissionsForRole, setIsSearchingPermissionsForRole] = useState(false);

  // Selected Items State
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [selectedRoleForUser, setSelectedRoleForUser] = useState<Role | null>(null);

  // Assignment State
  const [assignRolePermission, setAssignRolePermission] = useState({ roleId: '', permissionId: '' });

  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers();
      fetchRoles();
    } else if (activeSection === 'events') {
      fetchEvents();
      fetchEventTypes();
    } else if (activeSection === 'event-types') {
      fetchEventTypes();
    } else if (activeSection === 'roles') {
      fetchRoles();
      fetchPermissions();
      // Fetch all permissions initially for role creation dropdown
      searchPermissionsForRole('');
    } else if (activeSection === 'permissions') {
      fetchPermissions();
    }
  }, [activeSection]);

  // Fetch events when event filter changes
  useEffect(() => {
    if (activeSection === 'events') {
      fetchEvents();
    }
  }, [eventFilter]);

  // Debounced permission search
  useEffect(() => {
    if (permissionSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchPermissions(permissionSearch);
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [permissionSearch]);

  // Debounced role search
  useEffect(() => {
    if (roleSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchRoles(roleSearch);
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [roleSearch]);

  // Debounced user search for role assignment
  useEffect(() => {
    if (userRoleSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsersForRole(userRoleSearch);
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [userRoleSearch]);

  // Debounced role search for user assignment
  useEffect(() => {
    if (roleSearchForUser.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchRolesForUser(roleSearchForUser);
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [roleSearchForUser]);

  // Debounced permission search for role creation (call on every keystroke, including empty -> fetch all)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPermissionsForRole(permissionSearchForRole);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [permissionSearchForRole]);

  // Debounced permission search for role edit
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPermissionsForEdit(permissionSearchForEdit);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [permissionSearchForEdit]);

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  // Role Edit Functions
  const openRoleEditModal = (role: Role) => {
    setEditRole({
      id: role.id,
      name: role.name,
      description: role.description || '',
      isActive: role.isActive ?? true,
      permissionIds: role.permissions ? role.permissions.map(p => p.id) : []
    });
    setPermissionSearchForEdit('');
    setSearchedPermissionsForEdit([]);
    setShowPermissionForEditDropdown(false);
    setShowRoleEditModal(true);
  };

  const closeRoleEditModal = () => {
    setShowRoleEditModal(false);
  };

  const searchPermissionsForEdit = async (searchTerm: string) => {
    try {
      setIsSearchingPermissionsForEdit(true);
      const response = await adminApiClient.getPermissions(searchTerm.trim());
      const permissions = response.data.data || [];
      const filtered = permissions.filter(
        (perm: Permission) => !editRole.permissionIds.includes(perm.id)
      );
      setSearchedPermissionsForEdit(filtered);
      setShowPermissionForEditDropdown(true);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to search permissions', true);
      setSearchedPermissionsForEdit([]);
    } finally {
      setIsSearchingPermissionsForEdit(false);
    }
  };

  const handlePermissionSearchForEdit = (value: string) => {
    setPermissionSearchForEdit(value);
    setShowPermissionForEditDropdown(true);
  };

  const selectPermissionForEdit = (permission: Permission) => {
    setEditRole({
      ...editRole,
      permissionIds: [...editRole.permissionIds, permission.id]
    });
    setPermissionSearchForEdit('');
    setShowPermissionForEditDropdown(false);
    setSearchedPermissionsForEdit([]);
  };

  const removePermissionFromEdit = (permissionId: number) => {
    setEditRole({
      ...editRole,
      permissionIds: editRole.permissionIds.filter(id => id !== permissionId)
    });
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole.id) return;
    try {
      setLoading(true);
      await adminApiClient.updateRole(editRole.id, {
        name: editRole.name,
        description: editRole.description,
        permissionIds: editRole.permissionIds,
        isActive: editRole.isActive,
      });
      showMessage('Role updated successfully');
      setShowRoleEditModal(false);
      fetchRoles();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to update role', true);
    } finally {
      setLoading(false);
    }
  };

  // User Management Functions
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getUsers(userFilter);
      // Handle null or undefined data
      const users = response.data.data || [];
      setUsers(users);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch users', true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await adminApiClient.getRoles(roleFilter);
      // Handle null or undefined data
      const roles = response.data.data || [];
      setRoles(roles);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch roles', true);
      setRoles([]);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || newUser.roleIds.length === 0) {
      showMessage('Please select at least one role', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.addUser({
        email: newUser.email,
        roleIds: newUser.roleIds
      });
      showMessage('User added successfully');
      setNewUser({ email: '', roleIds: [] });
      fetchUsers();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to add user', true);
    } finally {
      setLoading(false);
    }
  };

  // Event Management Functions
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getEvents(eventFilter);
      // Handle null or undefined data
      const events = response.data.data || [];
      setEvents(events);
      
      // Update pagination
      if (response.data.pagination) {
        setPagination({
          currentPage: response.data.pagination.currentPage,
          limit: 10,
          totalItem: response.data.pagination.totalItem,
          totalPage: response.data.pagination.totalPage
        });
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch events', true);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await adminApiClient.getEventTypes(eventTypeFilter);
      // Handle null or undefined data - API only returns id and name
      const eventTypesData = response.data.data || [];
      const eventTypes = eventTypesData.map(et => ({
        id: et.id,
        name: et.name,
        description: '',
        autoEventCreate: false,
        autoEventCreateInterval: 0
      }));
      setEventTypes(eventTypes);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch event types', true);
      setEventTypes([]);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.description || !newEvent.eventTypeId || 
        !newEvent.eventStartsAt || !newEvent.registrationOpensAt || !newEvent.registrationClosesAt) {
      showMessage('Please fill in all fields', true);
      return;
    }

    try {
      setLoading(true);
      
      // Convert datetime-local strings to ISO 8601 format for the backend
      const formatDateTime = (dateTimeLocal: string): string => {
        // If it's already in ISO format, return as is
        if (dateTimeLocal.includes('T') && (dateTimeLocal.includes('Z') || dateTimeLocal.includes('+'))) {
          return dateTimeLocal;
        }
        // Convert datetime-local format to ISO 8601
        return new Date(dateTimeLocal).toISOString();
      };

      await adminApiClient.createEvent({
        title: newEvent.title,
        description: newEvent.description,
        eventTypeId: parseInt(newEvent.eventTypeId),
        eventStartsAt: formatDateTime(newEvent.eventStartsAt),
        registrationOpensAt: formatDateTime(newEvent.registrationOpensAt),
        registrationClosesAt: formatDateTime(newEvent.registrationClosesAt)
      });
      showMessage('Event created successfully');
      setNewEvent({
        title: '',
        description: '',
        eventTypeId: '',
        eventStartsAt: '',
        registrationOpensAt: '',
        registrationClosesAt: ''
      });
      fetchEvents();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to create event', true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventType.name || !newEventType.description) {
      showMessage('Please fill in all fields', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.createEventType(newEventType);
      showMessage('Event type created successfully');
      setNewEventType({
        name: '',
        description: '',
        autoEventCreate: false,
        autoEventCreateInterval: 0
      });
      fetchEventTypes();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to create event type', true);
    } finally {
      setLoading(false);
    }
  };

  // Role Management Functions
  const handleAddRoleV2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleV2.name || !newRoleV2.description || newRoleV2.permissionIds.length === 0) {
      showMessage('Please fill in all fields and select at least one permission', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.createRoleV2({
        roleName: newRoleV2.name,
        description: newRoleV2.description,
        permissionIds: newRoleV2.permissionIds
      });
      showMessage('Role created successfully with permissions');
      setNewRoleV2({ name: '', description: '', permissionIds: [] });
      fetchRoles();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to create role', true);
    } finally {
      setLoading(false);
    }
  };

  // Permission Management Functions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getPermissions(permissionFilter);
      // Handle null or undefined data
      const permissions = response.data.data || [];
      setPermissions(permissions);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch permissions', true);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermission.name || !newPermission.description) {
      showMessage('Please fill in all fields', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.createPermission({
        permissionName: newPermission.name,
        description: newPermission.description
      });
      showMessage('Permission created successfully');
      setNewPermission({ name: '', description: '' });
      fetchPermissions();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to create permission', true);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermissionToRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !selectedPermission) {
      showMessage('Please select both role and permission', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.assignPermissionToRole({
        roleId: selectedRole.id,
        permissionId: selectedPermission.id
      });
      showMessage('Permission assigned to role successfully');
      setAssignRolePermission({ roleId: '', permissionId: '' });
      setSelectedRole(null);
      setSelectedPermission(null);
      setRoleSearch('');
      setPermissionSearch('');
      setShowRoleDropdown(false);
      setShowPermissionDropdown(false);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to assign permission', true);
    } finally {
      setLoading(false);
    }
  };

  const searchPermissions = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchedPermissions([]);
      setShowPermissionDropdown(false);
      setIsSearchingPermissions(false);
      return;
    }

    try {
      setIsSearchingPermissions(true);
      const response = await adminApiClient.getPermissions(searchTerm);
      // Handle null or undefined data
      const permissions = response.data.data || [];
      setSearchedPermissions(permissions);
      setShowPermissionDropdown(true);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to search permissions', true);
      setSearchedPermissions([]);
    } finally {
      setIsSearchingPermissions(false);
    }
  };

  const handlePermissionSearch = (value: string) => {
    setPermissionSearch(value);
    
    // Clear selected permission if user starts typing again
    if (selectedPermission && value !== selectedPermission.name) {
      setSelectedPermission(null);
      setAssignRolePermission({ ...assignRolePermission, permissionId: '' });
    }
    
    // Control dropdown visibility based on input length
    if (value.length === 0) {
      setSearchedPermissions([]);
      setShowPermissionDropdown(false);
    } else if (value.length >= 1) {
      setShowPermissionDropdown(true);
      if (value.length < 2) {
        setSearchedPermissions([]);
      }
    }
  };

  const selectPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setPermissionSearch(permission.name);
    setShowPermissionDropdown(false);
    setAssignRolePermission({ ...assignRolePermission, permissionId: permission.id.toString() });
  };

  const searchRoles = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchedRoles([]);
      setShowRoleDropdown(false);
      setIsSearchingRoles(false);
      return;
    }

    try {
      setIsSearchingRoles(true);
      const response = await adminApiClient.getRoles(searchTerm);
      // Handle null or undefined data
      const roles = response.data.data || [];
      setSearchedRoles(roles);
      setShowRoleDropdown(true);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to search roles', true);
      setSearchedRoles([]);
    } finally {
      setIsSearchingRoles(false);
    }
  };

  const handleRoleSearch = (value: string) => {
    setRoleSearch(value);
    
    // Clear selected role if user starts typing again
    if (selectedRole && value !== selectedRole.name) {
      setSelectedRole(null);
      setAssignRolePermission({ ...assignRolePermission, roleId: '' });
    }
    
    // Control dropdown visibility based on input length
    if (value.length === 0) {
      setSearchedRoles([]);
      setShowRoleDropdown(false);
    } else if (value.length >= 1) {
      setShowRoleDropdown(true);
      if (value.length < 2) {
        setSearchedRoles([]);
      }
    }
  };

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setRoleSearch(role.name);
    setShowRoleDropdown(false);
    setAssignRolePermission({ ...assignRolePermission, roleId: role.id.toString() });
  };

  // User-Role Assignment Functions
  const searchUsersForRole = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchedUsersForRole([]);
      setShowUserRoleDropdown(false);
      setIsSearchingUsersForRole(false);
      return;
    }

    try {
      setIsSearchingUsersForRole(true);
      const response = await adminApiClient.getUsers(searchTerm);
      // Handle null or undefined data
      const users = response.data.data || [];
      setSearchedUsersForRole(users);
      setShowUserRoleDropdown(true);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to search users', true);
      setSearchedUsersForRole([]);
    } finally {
      setIsSearchingUsersForRole(false);
    }
  };

  const handleUserRoleSearch = (value: string) => {
    setUserRoleSearch(value);
    
    // Clear selected user if user starts typing again
    if (selectedUserForRole && value !== selectedUserForRole.email) {
      setSelectedUserForRole(null);
    }
    
    // Control dropdown visibility based on input length
    if (value.length === 0) {
      setSearchedUsersForRole([]);
      setShowUserRoleDropdown(false);
    } else if (value.length >= 1) {
      setShowUserRoleDropdown(true);
      if (value.length < 2) {
        setSearchedUsersForRole([]);
      }
    }
  };

  const selectUserForRole = (user: User) => {
    setSelectedUserForRole(user);
    setUserRoleSearch(user.email);
    setShowUserRoleDropdown(false);
  };

  const searchRolesForUser = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchedRolesForUser([]);
      setShowRoleForUserDropdown(false);
      setIsSearchingRolesForUser(false);
      return;
    }

    try {
      setIsSearchingRolesForUser(true);
      const response = await adminApiClient.getRoles(searchTerm);
      // Handle null or undefined data
      const roles = response.data.data || [];
      setSearchedRolesForUser(roles);
      setShowRoleForUserDropdown(true);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to search roles', true);
      setSearchedRolesForUser([]);
    } finally {
      setIsSearchingRolesForUser(false);
    }
  };

  const handleRoleSearchForUser = (value: string) => {
    setRoleSearchForUser(value);
    
    // Clear selected role if user starts typing again
    if (selectedRoleForUser && value !== selectedRoleForUser.name) {
      setSelectedRoleForUser(null);
    }
    
    // Control dropdown visibility based on input length
    if (value.length === 0) {
      setSearchedRolesForUser([]);
      setShowRoleForUserDropdown(false);
    } else if (value.length >= 1) {
      setShowRoleForUserDropdown(true);
      if (value.length < 2) {
        setSearchedRolesForUser([]);
      }
    }
  };

  const selectRoleForUser = (role: Role) => {
    setSelectedRoleForUser(role);
    setRoleSearchForUser(role.name);
    setShowRoleForUserDropdown(false);
  };

  const handleAssignRoleToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole || !selectedRoleForUser) {
      showMessage('Please select both user and role', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.assignRoleToUser({
        userId: selectedUserForRole.id,
        roleId: selectedRoleForUser.id
      });
      showMessage('Role assigned to user successfully');
      setSelectedUserForRole(null);
      setSelectedRoleForUser(null);
      setUserRoleSearch('');
      setRoleSearchForUser('');
      setShowUserRoleDropdown(false);
      setShowRoleForUserDropdown(false);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to assign role to user', true);
    } finally {
      setLoading(false);
    }
  };

  // Permission Search Functions for Role Creation
  const searchPermissionsForRole = async (searchTerm: string) => {
    try {
      setIsSearchingPermissionsForRole(true);
      // Empty search term should return all permissions from API
      const response = await adminApiClient.getPermissions(searchTerm.trim());
      // Handle null or undefined data
      const permissions = response.data.data || [];
      // Filter out already selected permissions
      const filteredPermissions = permissions.filter(
        permission => !newRoleV2.permissionIds.includes(permission.id)
      );
      setSearchedPermissionsForRole(filteredPermissions);
      setShowPermissionForRoleDropdown(true);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to search permissions', true);
      setSearchedPermissionsForRole([]);
    } finally {
      setIsSearchingPermissionsForRole(false);
    }
  };

  const handlePermissionSearchForRole = (value: string) => {
    setPermissionSearchForRole(value);
    // Always show dropdown while typing; content is driven by debounced search
    setShowPermissionForRoleDropdown(true);
  };

  const selectPermissionForRole = (permission: Permission) => {
    // Add permission to selected list
    setNewRoleV2({
      ...newRoleV2,
      permissionIds: [...newRoleV2.permissionIds, permission.id]
    });
    // Clear search
    setPermissionSearchForRole('');
    setShowPermissionForRoleDropdown(false);
    setSearchedPermissionsForRole([]);
  };

  const removePermissionFromRole = (permissionId: number) => {
    setNewRoleV2({
      ...newRoleV2,
      permissionIds: newRoleV2.permissionIds.filter(id => id !== permissionId)
    });
  };

  const handleEventClick = async (eventId: number) => {
    try {
      setLoading(true);
      const response = await adminApiClient.getEventDetails(eventId);
      setSelectedEvent(response.data);
      setShowEventModal(true);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch event details', true);
    } finally {
      setLoading(false);
    }
  };

  const renderUserPanel = () => (
    <div className="panel">
      <h3>User Management</h3>
      
      {/* Add User Form */}
      <div className="form-section">
        <h4>Add New User</h4>
        <form onSubmit={handleAddUser} className="admin-form">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="Enter user email"
              required
            />
          </div>
          <div className="form-group">
            <label>Roles:</label>
            <div className="role-selection-container">
              <select
                multiple
                value={newUser.roleIds.map(id => id.toString())}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions);
                  const selectedRoleIds = selectedOptions.map(option => parseInt(option.value));
                  setNewUser({ ...newUser, roleIds: selectedRoleIds });
                }}
                required
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {newUser.roleIds.length > 0 && (
                <div className="selected-roles">
                  <h5>Selected Roles:</h5>
                  <div className="role-tags">
                    {newUser.roleIds.map(roleId => {
                      const role = roles.find(r => r.id === roleId);
                      return role ? (
                        <span key={roleId} className="role-tag">
                          {role.name}
                          <button
                            type="button"
                            className="remove-role-btn"
                            onClick={() => {
                              setNewUser({
                                ...newUser,
                                roleIds: newUser.roleIds.filter(id => id !== roleId)
                              });
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>

      {/* Assign Role to User Form */}
      <div className="form-section">
        <h4>Assign Role to User</h4>
        <form onSubmit={handleAssignRoleToUser} className="admin-form">
          <div className="form-group">
            <label>User:</label>
            <div className="search-container">
              <input
                type="text"
                value={userRoleSearch}
                onChange={(e) => handleUserRoleSearch(e.target.value)}
                placeholder="Search user by email..."
                required
              />
              {showUserRoleDropdown && (
                <div className="search-dropdown">
                  {isSearchingUsersForRole ? (
                    <div className="search-dropdown-item no-results">
                      Searching users...
                    </div>
                  ) : searchedUsersForRole.length > 0 ? (
                    searchedUsersForRole.map(user => (
                      <div
                        key={user.id}
                        className="search-dropdown-item"
                        onClick={() => selectUserForRole(user)}
                      >
                        <strong>{user.email}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="search-dropdown-item no-results">
                      {userRoleSearch.length === 0 
                        ? "Start typing to search users..."
                        : userRoleSearch.length < 2 
                          ? "Type at least 2 characters to search..."
                          : `No users found matching "${userRoleSearch}"`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedUserForRole && (
              <div className="selected-permission">
                Selected: <strong>{selectedUserForRole.email}</strong>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Role:</label>
            <div className="search-container">
              <input
                type="text"
                value={roleSearchForUser}
                onChange={(e) => handleRoleSearchForUser(e.target.value)}
                placeholder="Search role by name..."
                required
              />
              {showRoleForUserDropdown && (
                <div className="search-dropdown">
                  {isSearchingRolesForUser ? (
                    <div className="search-dropdown-item no-results">
                      Searching roles...
                    </div>
                  ) : searchedRolesForUser.length > 0 ? (
                    searchedRolesForUser.map(role => (
                      <div
                        key={role.id}
                        className="search-dropdown-item"
                        onClick={() => selectRoleForUser(role)}
                      >
                        <strong>{role.name}</strong>
                        <span className="permission-desc">{role.description}</span>
                      </div>
                    ))
                  ) : (
                    <div className="search-dropdown-item no-results">
                      {roleSearchForUser.length === 0 
                        ? "Start typing to search roles..."
                        : roleSearchForUser.length < 2 
                          ? "Type at least 2 characters to search..."
                          : `No roles found matching "${roleSearchForUser}"`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedRoleForUser && (
              <div className="selected-permission">
                Selected: <strong>{selectedRoleForUser.name}</strong> - {selectedRoleForUser.description}
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Assigning...' : 'Assign Role to User'}
          </button>
        </form>
      </div>

      {/* User List */}
      <div className="list-section">
        <h4>Users</h4>
        <div className="filter-section">
          <input
            type="text"
            placeholder="Filter by email"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
          <button onClick={fetchUsers} className="btn-secondary">
            Filter
          </button>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(user => 
                user.email.toLowerCase().includes(userFilter.toLowerCase())
              ).map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEventTypePanel = () => (
    <div className="panel">
      <h3>Event Type Management</h3>
      
      {/* Add Event Type Form */}
      <div className="form-section">
        <h4>Add New Event Type</h4>
        <form onSubmit={handleAddEventType} className="admin-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newEventType.name}
              onChange={(e) => setNewEventType({ ...newEventType, name: e.target.value })}
              placeholder="Enter event type name"
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newEventType.description}
              onChange={(e) => setNewEventType({ ...newEventType, description: e.target.value })}
              placeholder="Enter event type description"
              required
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={newEventType.autoEventCreate}
                onChange={(e) => setNewEventType({ ...newEventType, autoEventCreate: e.target.checked })}
              />
              Auto Create Events
            </label>
          </div>
          {newEventType.autoEventCreate && (
            <div className="form-group">
              <label>Auto Create Interval (seconds):</label>
              <input
                type="number"
                value={newEventType.autoEventCreateInterval}
                onChange={(e) => setNewEventType({ ...newEventType, autoEventCreateInterval: parseInt(e.target.value) })}
                min="0"
              />
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Event Type'}
          </button>
        </form>
      </div>

      {/* Event Type List */}
      <div className="list-section">
        <h4>Event Types</h4>
        <div className="filter-section">
          <input
            type="text"
            placeholder="Filter by name"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
          />
          <button onClick={fetchEventTypes} className="btn-secondary">
            Filter
          </button>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {eventTypes.map(eventType => (
                <tr key={eventType.id}>
                  <td>{eventType.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEventPanel = () => (
    <div className="panel">
      <h3>Event Management</h3>

      {/* Add Event Form */}
      <div className="form-section">
        <h4>Add New Event</h4>
        <form onSubmit={handleAddEvent} className="admin-form">
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Enter event title"
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Enter event description"
              required
            />
          </div>
          <div className="form-group">
            <label>Event Type:</label>
            <select
              value={newEvent.eventTypeId}
              onChange={(e) => setNewEvent({ ...newEvent, eventTypeId: e.target.value })}
              required
            >
              <option value="">Select event type</option>
              {eventTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Event Starts At:</label>
            <input
              type="datetime-local"
              value={newEvent.eventStartsAt}
              onChange={(e) => setNewEvent({ ...newEvent, eventStartsAt: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Registration Opens At:</label>
            <input
              type="datetime-local"
              value={newEvent.registrationOpensAt}
              onChange={(e) => setNewEvent({ ...newEvent, registrationOpensAt: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Registration Closes At:</label>
            <input
              type="datetime-local"
              value={newEvent.registrationClosesAt}
              onChange={(e) => setNewEvent({ ...newEvent, registrationClosesAt: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>

      {/* Event List */}
      <div className="list-section">
        <h4>Events</h4>
        <div className="filter-section">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Filter by title"
              value={eventFilter.title}
              onChange={(e) => setEventFilter({ ...eventFilter, title: e.target.value })}
            />
            <input
              type="number"
              placeholder="Filter by ID"
              value={eventFilter.id || ''}
              onChange={(e) => setEventFilter({ ...eventFilter, id: e.target.value ? parseInt(e.target.value) : undefined })}
            />
            <select
              value={eventFilter.typeId}
              onChange={(e) => setEventFilter({ ...eventFilter, typeId: e.target.value })}
            >
              <option value="">All Types</option>
              {eventTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <select
              value={eventFilter.mode}
              onChange={(e) => setEventFilter({ ...eventFilter, mode: e.target.value as any })}
            >
              <option value="ALL">All Events</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="RECENT">Recent</option>
            </select>
          </div>
          <div className="filter-row">
            <label>Start Time From:</label>
            <input
              type="datetime-local"
              value={eventFilter.startTime}
              onChange={(e) => setEventFilter({ ...eventFilter, startTime: e.target.value })}
            />
            <label>Start Time To:</label>
            <input
              type="datetime-local"
              value={eventFilter.endTime}
              onChange={(e) => setEventFilter({ ...eventFilter, endTime: e.target.value })}
            />
            <select
              value={eventFilter.sortBy}
              onChange={(e) => setEventFilter({ ...eventFilter, sortBy: e.target.value })}
            >
              <option value="id">Sort by ID</option>
              <option value="startAt">Sort by Start Time</option>
            </select>
            <select
              value={eventFilter.sortOrder}
              onChange={(e) => setEventFilter({ ...eventFilter, sortOrder: e.target.value as any })}
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>
          <div className="filter-row">
            <label>Page Size:</label>
            <select
              value={eventFilter.limit}
              onChange={(e) => setEventFilter({ ...eventFilter, limit: parseInt(e.target.value), page: 1 })}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <button onClick={fetchEvents} className="btn-secondary">
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* Pagination Info */}
        <div className="pagination-info">
          <span>Page {pagination.currentPage} of {pagination.totalPage} (Total: {pagination.totalItem} events)</span>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Title (Click for Details)</th>
                <th>Type</th>
                <th>Starts At</th>
                <th>Registration Opens</th>
                <th>Registration Closes</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id} onClick={() => handleEventClick(event.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: '#007bff', textDecoration: 'underline' }}>{event.title}</td>
                  <td>{event.eventType}</td>
                  <td>{new Date(event.startAt).toLocaleString()}</td>
                  <td>{new Date(event.registrationOpensAt).toLocaleString()}</td>
                  <td>{new Date(event.registrationClosesAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-controls">
          <button 
            onClick={() => setEventFilter({ ...eventFilter, page: Math.max(1, (eventFilter.page || 1) - 1) })}
            disabled={(eventFilter.page || 1) <= 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <span>Page {eventFilter.page || 1} of {pagination.totalPage}</span>
          <button 
            onClick={() => setEventFilter({ ...eventFilter, page: Math.min(pagination.totalPage, (eventFilter.page || 1) + 1) })}
            disabled={(eventFilter.page || 1) >= pagination.totalPage}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  const renderRolePanel = () => (
    <div className="panel">
      <h3>Role Management</h3>
      
      {/* Add Role with Permissions Form */}
      <div className="form-section">
        <h4>Add New Role with Permissions</h4>
        <form onSubmit={handleAddRoleV2} className="admin-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newRoleV2.name}
              onChange={(e) => setNewRoleV2({ ...newRoleV2, name: e.target.value })}
              placeholder="Enter role name"
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newRoleV2.description}
              onChange={(e) => setNewRoleV2({ ...newRoleV2, description: e.target.value })}
              placeholder="Enter role description"
              required
            />
          </div>
          <div className="form-group">
            <label>Permissions:</label>
            <div className="permission-selection-container">
              <div className="search-container">
                <input
                  type="text"
                  value={permissionSearchForRole}
                  onChange={(e) => handlePermissionSearchForRole(e.target.value)}
                  placeholder="Search permissions by name..."
                />
                {showPermissionForRoleDropdown && (
                  <div className="search-dropdown">
                    {isSearchingPermissionsForRole ? (
                      <div className="search-dropdown-item no-results">
                        Searching permissions...
                      </div>
                    ) : searchedPermissionsForRole.length > 0 ? (
                      searchedPermissionsForRole.map(permission => (
                        <div
                          key={permission.id}
                          className="search-dropdown-item"
                          onClick={() => selectPermissionForRole(permission)}
                        >
                          <strong>{permission.name}</strong>
                          <span className="permission-desc">{permission.description}</span>
                        </div>
                      ))
                    ) : (
                      <div className="search-dropdown-item no-results">
                        {permissionSearchForRole.length === 0 
                          ? "Start typing to search permissions..."
                          : permissionSearchForRole.length < 2 
                            ? "Type at least 2 characters to search..."
                            : `No permissions found matching "${permissionSearchForRole}"`
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
              {newRoleV2.permissionIds.length > 0 && (
                <div className="selected-permissions-display">
                  <h5>Selected Permissions:</h5>
                  <div className="permission-tags">
                    {newRoleV2.permissionIds.map(permissionId => {
                      const permission = permissions.find(p => p.id === permissionId);
                      return permission ? (
                        <span key={permissionId} className="permission-tag">
                          {permission.name}
                          <button
                            type="button"
                            className="remove-permission-btn"
                            onClick={() => removePermissionFromRole(permissionId)}
                            title="Remove permission"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
           <button type="submit" disabled={loading} className="btn-primary create-role-btn">
            {loading ? 'Creating...' : 'Create'}
          </button>
          
        </form>
       
      </div>

      {/* Role List */}
      <div className="list-section">
        <h4>Roles</h4>
        <div className="filter-section">
          <input
            type="text"
            placeholder="Filter by name"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
          <button onClick={fetchRoles} className="btn-secondary">
            Filter
          </button>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Active</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  <td>{role.description}</td>
                  <td>
                    {role.permissions && role.permissions.length > 0 ? (
                      <div className="role-permissions">
                        {role.permissions.map(permission => (
                          <span key={permission.id} className="role-permission-tag">
                            {permission.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-permissions">No permissions</span>
                    )}
                  </td>
                  <td>{role.isActive ? 'Yes' : 'No'}</td>
                  <td>{new Date(role.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-secondary" onClick={() => openRoleEditModal(role)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPermissionPanel = () => (
    <div className="panel">
      <h3>Permission Management</h3>
      
      {/* Add Permission Form */}
      <div className="form-section">
        <h4>Add New Permission</h4>
        <form onSubmit={handleAddPermission} className="admin-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newPermission.name}
              onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
              placeholder="Enter permission name"
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newPermission.description}
              onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
              placeholder="Enter permission description"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Permission'}
          </button>
        </form>
      </div>

      {/* Assign Permission to Role Form */}
      <div className="form-section">
        <h4>Assign Permission to Role</h4>
        <form onSubmit={handleAssignPermissionToRole} className="admin-form">
          <div className="form-group">
            <label>Role:</label>
            <div className="search-container">
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => handleRoleSearch(e.target.value)}
                placeholder="Search role by name..."
                required
              />
              {showRoleDropdown && (
                <div className="search-dropdown">
                  {isSearchingRoles ? (
                    <div className="search-dropdown-item no-results">
                      Searching roles...
                    </div>
                  ) : searchedRoles.length > 0 ? (
                    searchedRoles.map(role => (
                      <div
                        key={role.id}
                        className="search-dropdown-item"
                        onClick={() => selectRole(role)}
                      >
                        <strong>{role.name}</strong>
                        <span className="permission-desc">{role.description}</span>
                      </div>
                    ))
                  ) : (
                    <div className="search-dropdown-item no-results">
                      {roleSearch.length === 0 
                        ? "Start typing to search roles..."
                        : roleSearch.length < 2 
                          ? "Type at least 2 characters to search..."
                          : `No roles found matching "${roleSearch}"`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedRole && (
              <div className="selected-permission">
                Selected: <strong>{selectedRole.name}</strong> - {selectedRole.description}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Permission:</label>
            <div className="search-container">
              <input
                type="text"
                value={permissionSearch}
                onChange={(e) => handlePermissionSearch(e.target.value)}
                placeholder="Search permission by name..."
                required
              />
              {showPermissionDropdown && (
                <div className="search-dropdown">
                  {isSearchingPermissions ? (
                    <div className="search-dropdown-item no-results">
                      Searching permissions...
                    </div>
                  ) : searchedPermissions.length > 0 ? (
                    searchedPermissions.map(permission => (
                      <div
                        key={permission.id}
                        className="search-dropdown-item"
                        onClick={() => selectPermission(permission)}
                      >
                        <strong>{permission.name}</strong>
                        <span className="permission-desc">{permission.description}</span>
                      </div>
                    ))
                  ) : (
                    <div className="search-dropdown-item no-results">
                      {permissionSearch.length === 0 
                        ? "Start typing to search permissions..."
                        : permissionSearch.length < 2 
                          ? "Type at least 2 characters to search..."
                          : `No permissions found matching "${permissionSearch}"`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedPermission && (
              <div className="selected-permission">
                Selected: <strong>{selectedPermission.name}</strong> - {selectedPermission.description}
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Assigning...' : 'Assign Permission'}
          </button>
        </form>
      </div>

      {/* Permission List */}
      <div className="list-section">
        <h4>Permissions</h4>
        <div className="filter-section">
          <input
            type="text"
            placeholder="Filter by name"
            value={permissionFilter}
            onChange={(e) => setPermissionFilter(e.target.value)}
          />
          <button onClick={fetchPermissions} className="btn-secondary">
            Filter
          </button>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(permission => (
                <tr key={permission.id}>
                  <td>{permission.name}</td>
                  <td>{permission.description}</td>
                  <td>{new Date(permission.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEventModal = () => {
    if (!showEventModal || !selectedEvent) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Event Details</h3>
            <button 
              className="modal-close" 
              onClick={() => setShowEventModal(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="event-details">
              <h4>{selectedEvent.eventDetails.title}</h4>
              <p><strong>Description:</strong> {selectedEvent.eventDetails.description}</p>
              <p><strong>Event Type:</strong> {selectedEvent.eventDetails.eventType}</p>
              <p><strong>Starts At:</strong> {new Date(selectedEvent.eventDetails.startAt).toLocaleString()}</p>
              <p><strong>Registration Opens:</strong> {new Date(selectedEvent.eventDetails.registrationOpensAt).toLocaleString()}</p>
              <p><strong>Registration Closes:</strong> {new Date(selectedEvent.eventDetails.registrationClosesAt).toLocaleString()}</p>
              <p><strong>Created By:</strong> {selectedEvent.eventDetails.createdBy}</p>
              <p><strong>Created At:</strong> {new Date(selectedEvent.eventDetails.createdAt).toLocaleString()}</p>
            </div>

            <div className="participants-section">
              <h4>Participants ({selectedEvent.participantDetails.totalParticipants})</h4>
              {selectedEvent.participantDetails.participants && selectedEvent.participantDetails.participants.length > 0 ? (
                <div className="participants-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Guest Count</th>
                        <th>Remarks</th>
                        <th>Registered At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEvent.participantDetails.participants.map((participant: any, index: number) => (
                        <tr key={index}>
                          <td>{participant.userEmail}</td>
                          <td>{participant.guestCount}</td>
                          <td>{participant.remarks || 'N/A'}</td>
                          <td>{new Date(participant.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No participants registered for this event.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRoleEditModal = () => {
    if (!showRoleEditModal || editRole.id === null) return null;
    return (
      <div className="modal-overlay" onClick={closeRoleEditModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Edit Role</h3>
            <button className="modal-close" onClick={closeRoleEditModal}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleUpdateRole} className="admin-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editRole.name}
                  onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={editRole.description}
                  onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Active:</label>
                <input
                  type="checkbox"
                  checked={editRole.isActive}
                  onChange={(e) => setEditRole({ ...editRole, isActive: e.target.checked })}
                />
              </div>
              <div className="form-group">
                <label>Permissions:</label>
                <div className="search-container">
                  <input
                    type="text"
                    value={permissionSearchForEdit}
                    onChange={(e) => handlePermissionSearchForEdit(e.target.value)}
                    placeholder="Search and add permissions..."
                  />
                  {showPermissionForEditDropdown && (
                    <div className="search-dropdown">
                      {isSearchingPermissionsForEdit ? (
                        <div className="search-dropdown-item no-results">Searching permissions...</div>
                      ) : searchedPermissionsForEdit.length > 0 ? (
                        searchedPermissionsForEdit.map((permission: Permission) => (
                          <div
                            key={permission.id}
                            className="search-dropdown-item"
                            onClick={() => selectPermissionForEdit(permission)}
                          >
                            <strong>{permission.name}</strong>
                            <span className="permission-desc">{permission.description}</span>
                          </div>
                        ))
                      ) : (
                        <div className="search-dropdown-item no-results">
                          {permissionSearchForEdit.length === 0
                            ? 'Start typing to search permissions...'
                            : permissionSearchForEdit.length < 2
                              ? 'Type at least 2 characters to search...'
                              : `No permissions found matching "${permissionSearchForEdit}"`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {editRole.permissionIds.length > 0 && (
                  <div className="selected-permissions">
                    <h5>Selected Permissions:</h5>
                    <div className="permission-tags">
                      {editRole.permissionIds.map((pid: number) => {
                        const perm = permissions.find((p: Permission) => p.id === pid);
                        return perm ? (
                          <span key={pid} className="permission-tag">
                            {perm.name}
                            <button
                              type="button"
                              className="remove-permission-btn"
                              onClick={() => removePermissionFromEdit(pid)}
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeRoleEditModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="header-right">
          <span>Welcome, {user?.email}</span>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        <nav className="admin-nav">
          <ul>
            <li>
              <button
                className={activeSection === 'users' ? 'active' : ''}
                onClick={() => setActiveSection('users')}
              >
                User Management
              </button>
            </li>
            <li>
              <button
                className={activeSection === 'events' ? 'active' : ''}
                onClick={() => setActiveSection('events')}
              >
                Event Management
              </button>
            </li>
            <li>
              <button
                className={activeSection === 'event-types' ? 'active' : ''}
                onClick={() => setActiveSection('event-types')}
              >
                Event Type Management
              </button>
            </li>
            <li>
              <button
                className={activeSection === 'roles' ? 'active' : ''}
                onClick={() => setActiveSection('roles')}
              >
                Role Management
              </button>
            </li>
            <li>
              <button
                className={activeSection === 'permissions' ? 'active' : ''}
                onClick={() => setActiveSection('permissions')}
              >
                Permission Management
              </button>
            </li>
          </ul>
        </nav>

        <main className="admin-main">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {loading && <div className="loading">Loading...</div>}
          
          {activeSection === 'users' && renderUserPanel()}
          {activeSection === 'events' && renderEventPanel()}
          {activeSection === 'event-types' && renderEventTypePanel()}
          {activeSection === 'roles' && renderRolePanel()}
          {activeSection === 'permissions' && renderPermissionPanel()}
        </main>
      </div>

      {/* Event Details Modal */}
      {renderEventModal()}
      {/* Role Edit Modal */}
      {renderRoleEditModal()}
    </div>
  );
};

export default AdminDashboard;