/**
 * UserManagement Page Component
 * 
 * Manages system users with invitation functionality and role assignment.
 * Uses shared components for consistent UI and follows DRY principles.
 * 
 * Features:
 * - User invitation with email and username
 * - Role selection with visual feedback
 * - User listing with status indicators
 * - Search and filtering capabilities
 */

import React, { useState, useEffect } from 'react';
import { adminApiClient } from '../../services';
import { User, Role } from '../../types/admin';
import { useMessage } from '../../hooks';
import { 
  Button, 
  Input, 
  Card, 
  Table, 
  Badge, 
  SearchInput,
  MessageDisplay,
  Column 
} from '../shared';
import { UI_MESSAGES, FORM_LABELS } from '../../constants/ui';

interface UserManagementProps {
  showMessage: (message: string, isError?: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  showMessage, 
  loading, 
  setLoading 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    userName: '',
    roleIds: [] as number[]
  });

  const { message, messageType, showMessage: showLocalMessage, clearMessage } = useMessage();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminApiClient.getUsers(userFilter);
      setUsers(response.data.data || []);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch users', true);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await adminApiClient.getRoles();
      setRoles(response.data.data || []);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch roles', true);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.userName || newUser.roleIds.length === 0) {
      showLocalMessage('Please fill in all required fields and select at least one role', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await adminApiClient.addUser(newUser);
      showLocalMessage('User invitation sent successfully', 'success');
      setNewUser({ email: '', userName: '', roleIds: [] });
      fetchUsers();
    } catch (err: any) {
      showLocalMessage(err.response?.data?.message || 'Failed to invite user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId: number) => {
    setNewUser(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  const clearSelectedRoles = () => {
    setNewUser(prev => ({ ...prev, roleIds: [] }));
  };

  const columns: Column[] = [
    { key: 'user', label: 'User', sortable: true },
    { key: 'status', label: FORM_LABELS.STATUS, width: '120px' },
    { key: 'roles', label: 'Roles' },
    { key: 'createdAt', label: FORM_LABELS.CREATED_AT, width: '120px' },
  ];

  const renderUserRow = (user: User, index: number) => (
    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.email}</div>
            <div className="text-sm text-gray-500">ID: {user.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge 
          variant={user.isActive ? 'success' : 'danger'} 
          dot
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4">
        {user.roles && user.roles.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {user.roles.slice(0, 3).map(role => (
              <Badge key={role.id} variant="info" size="sm">
                {role.name}
              </Badge>
            ))}
            {user.roles.length > 3 && (
              <Badge variant="default" size="sm">
                +{user.roles.length - 3} more
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">No roles assigned</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <MessageDisplay
        message={message}
        type={messageType}
        onDismiss={clearMessage}
      />

      {/* User Invitation Form */}
      <Card 
        title="Invite New User"
        subtitle="Send an invitation to join the system"
      >
        <form onSubmit={handleInviteUser} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Input
              label={FORM_LABELS.EMAIL}
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
            
            <Input
              label="Username"
              type="text"
              value={newUser.userName}
              onChange={(e) => setNewUser({ ...newUser, userName: e.target.value })}
              placeholder="Enter username"
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Roles <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {roles.map(role => (
                <label
                  key={role.id}
                  className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                    newUser.roleIds.includes(role.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={newUser.roleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                    newUser.roleIds.includes(role.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {newUser.roleIds.includes(role.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{role.name}</div>
                    <div className="text-xs text-gray-500">{role.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Selected Roles Display */}
            {newUser.roleIds.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Selected Roles ({newUser.roleIds.length})
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSelectedRoles}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {newUser.roleIds.map(roleId => {
                    const role = roles.find(r => r.id === roleId);
                    return role ? (
                      <Badge key={roleId} variant="primary" size="sm">
                        {role.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!newUser.email || !newUser.userName || newUser.roleIds.length === 0}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Card>

      {/* Users List */}
      <Card 
        title={`System Users (${users.length})`}
        subtitle="View and manage all system users"
        headerAction={
          <div className="flex items-center space-x-3">
            <SearchInput
              placeholder="Filter users..."
              onSearch={setUserFilter}
              className="w-64"
            />
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              Refresh
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          data={users}
          renderRow={renderUserRow}
          emptyMessage={userFilter ? `No users match "${userFilter}"` : 'No users found'}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default UserManagement;
