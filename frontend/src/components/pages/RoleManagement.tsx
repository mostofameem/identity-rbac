/**
 * RoleManagement Page Component
 * 
 * Manages system roles with permission assignment functionality.
 * Uses shared components for consistent UI and follows DRY principles.
 * 
 * Features:
 * - Role creation with permission assignment
 * - Permission search and selection
 * - Role listing with assigned permissions
 * - Responsive design with compact layout
 */

import React, { useState, useEffect } from 'react';
import { adminApiClient } from '../../services';
import { Role, Permission } from '../../types/admin';
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

interface RoleManagementProps {
  showMessage: (message: string, isError?: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ 
  showMessage, 
  loading, 
  setLoading 
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [searchedPermissions, setSearchedPermissions] = useState<Permission[]>([]);
  const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissionIds: [] as number[]
  });

  const { message, messageType, showMessage: showLocalMessage, clearMessage } = useMessage();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (permissionSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchPermissions(permissionSearch);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setShowPermissionDropdown(false);
    }
  }, [permissionSearch]);

  const fetchRoles = async () => {
    try {
      const response = await adminApiClient.getRoles(roleFilter);
      setRoles(response.data.data || []);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch roles', true);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await adminApiClient.getPermissions();
      setPermissions(response.data.data || []);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch permissions', true);
    }
  };

  const searchPermissions = async (searchTerm: string) => {
    try {
      const response = await adminApiClient.getPermissions(searchTerm);
      setSearchedPermissions(response.data.data || []);
      setShowPermissionDropdown(true);
    } catch (err: any) {
      setSearchedPermissions([]);
      setShowPermissionDropdown(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRole.name || !newRole.description) {
      showLocalMessage('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await adminApiClient.createRoleV2({
        roleName: newRole.name,
        description: newRole.description,
        permissionIds: newRole.permissionIds
      });
      showLocalMessage('Role created successfully', 'success');
      setNewRole({ name: '', description: '', permissionIds: [] });
      setPermissionSearch('');
      fetchRoles();
    } catch (err: any) {
      showLocalMessage(err.response?.data?.message || 'Failed to create role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectPermission = (permission: Permission) => {
    if (!newRole.permissionIds.includes(permission.id)) {
      setNewRole(prev => ({
        ...prev,
        permissionIds: [...prev.permissionIds, permission.id]
      }));
    }
    setPermissionSearch('');
    setShowPermissionDropdown(false);
  };

  const removePermission = (permissionId: number) => {
    setNewRole(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.filter(id => id !== permissionId)
    }));
  };

  const clearAllPermissions = () => {
    setNewRole(prev => ({ ...prev, permissionIds: [] }));
  };

  const columns: Column[] = [
    { key: 'role', label: 'Role', sortable: true },
    { key: 'description', label: FORM_LABELS.DESCRIPTION },
    { key: 'permissions', label: 'Permissions' },
    { key: 'createdAt', label: FORM_LABELS.CREATED_AT, width: '120px' },
  ];

  const renderRoleRow = (role: Role, index: number) => (
    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{role.name}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-700 max-w-xs">{role.description}</div>
      </td>
      <td className="px-6 py-4">
        {role.permissions && role.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {role.permissions.slice(0, 3).map(permission => (
              <Badge key={permission.id} variant="info" size="sm">
                {permission.name}
              </Badge>
            ))}
            {role.permissions.length > 3 && (
              <Badge variant="default" size="sm">
                +{role.permissions.length - 3} more
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">No permissions assigned</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(role.createdAt).toLocaleDateString('en-US', {
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

      {/* Role Creation Form */}
      <Card 
        title="Create New Role"
        subtitle="Define a new role with specific permissions"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Input
              label="Role Name"
              type="text"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              placeholder="e.g., Admin, Editor"
              required
            />
            
            <Input
              label={FORM_LABELS.DESCRIPTION}
              type="text"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              placeholder="Brief role description"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Permissions
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  placeholder="Search permissions..."
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                
                {showPermissionDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchedPermissions.length > 0 ? (
                      searchedPermissions.map(permission => (
                        <div
                          key={permission.id}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => selectPermission(permission)}
                        >
                          <div className="font-medium text-gray-900 text-sm">{permission.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{permission.description}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        {permissionSearch.length < 2 
                          ? "Type at least 2 characters..."
                          : "No permissions found"
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Permissions */}
          {newRole.permissionIds.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Selected Permissions ({newRole.permissionIds.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllPermissions}
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {newRole.permissionIds.map(permissionId => {
                  const permission = permissions.find(p => p.id === permissionId);
                  return permission ? (
                    <Badge key={permissionId} variant="primary" size="sm">
                      {permission.name}
                      <button
                        type="button"
                        className="ml-1 hover:text-red-600"
                        onClick={() => removePermission(permissionId)}
                      >
                        ×
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!newRole.name || !newRole.description}
            >
              Create Role
            </Button>
          </div>
        </form>
      </Card>

      {/* Roles List */}
      <Card 
        title={`Existing Roles (${roles.length})`}
        subtitle="View and manage all system roles"
        headerAction={
          <div className="flex items-center space-x-3">
            <SearchInput
              placeholder="Filter roles..."
              onSearch={setRoleFilter}
              className="w-64"
            />
            <Button variant="outline" size="sm" onClick={fetchRoles}>
              Refresh
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          data={roles}
          renderRow={renderRoleRow}
          emptyMessage={roleFilter ? `No roles match "${roleFilter}"` : 'No roles found'}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default RoleManagement;
