import React, { useState, useEffect } from 'react';
import { adminApiClient } from '../services';
import { Role, Permission } from '../types/admin';

interface RoleManagementProps {
  showMessage: (message: string, isError?: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ showMessage, loading, setLoading }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newRoleV2, setNewRoleV2] = useState({ name: '', description: '', permissionIds: [] as number[] });
  const [roleFilter, setRoleFilter] = useState('');

  // Permission Search State for Role Creation
  const [permissionSearchForRole, setPermissionSearchForRole] = useState('');
  const [searchedPermissionsForRole, setSearchedPermissionsForRole] = useState<Permission[]>([]);
  const [showPermissionForRoleDropdown, setShowPermissionForRoleDropdown] = useState(false);
  const [isSearchingPermissionsForRole, setIsSearchingPermissionsForRole] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // Debounced permission search for role creation
  useEffect(() => {
    if (permissionSearchForRole.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchPermissionsForRole(permissionSearchForRole);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [permissionSearchForRole]);

  const fetchRoles = async () => {
    try {
      const response = await adminApiClient.getRoles(roleFilter);
      const roles = response.data.data || [];
      setRoles(roles);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch roles', true);
      setRoles([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await adminApiClient.getPermissions();
      setPermissions(response.data.data || []);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch permissions', true);
      setPermissions([]);
    }
  };

  const searchPermissionsForRole = async (searchTerm: string) => {
    setIsSearchingPermissionsForRole(true);
    setShowPermissionForRoleDropdown(true);
    try {
      const response = await adminApiClient.getPermissions(searchTerm);
      setSearchedPermissionsForRole(response.data.data || []);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to search permissions', true);
      setSearchedPermissionsForRole([]);
    } finally {
      setIsSearchingPermissionsForRole(false);
    }
  };

  const handlePermissionSearchForRole = (value: string) => {
    setPermissionSearchForRole(value);
    if (value.length === 0) {
      setShowPermissionForRoleDropdown(false);
      setSearchedPermissionsForRole([]);
    }
  };

  const selectPermissionForRole = (permission: Permission) => {
    if (!newRoleV2.permissionIds.includes(permission.id)) {
      setNewRoleV2({
        ...newRoleV2,
        permissionIds: [...newRoleV2.permissionIds, permission.id]
      });
    }
    setPermissionSearchForRole('');
    setShowPermissionForRoleDropdown(false);
    setSearchedPermissionsForRole([]);
  };

  const handleAddRoleV2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleV2.name || !newRoleV2.description) {
      showMessage('Please fill in all required fields', true);
      return;
    }
    
    try {
      setLoading(true);
      await adminApiClient.createRoleV2({
        roleName: newRoleV2.name,
        description: newRoleV2.description,
        permissionIds: newRoleV2.permissionIds
      });
      showMessage('Role created successfully');
      setNewRoleV2({ name: '', description: '', permissionIds: [] });
      fetchRoles();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to create role', true);
    } finally {
      setLoading(false);
    }
  };

  const removePermissionFromRole = (permissionId: number) => {
    setNewRoleV2({
      ...newRoleV2,
      permissionIds: newRoleV2.permissionIds.filter(id => id !== permissionId)
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Role Management</h1>
        <p className="text-lg text-gray-600">Create and manage system roles with permissions</p>
      </div>

      {/* Create New Role Section - Compact */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Role
          </h2>
        </div>
        
        <form onSubmit={handleAddRoleV2} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Role Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                value={newRoleV2.name}
                onChange={(e) => setNewRoleV2({ ...newRoleV2, name: e.target.value })}
                placeholder="e.g., Admin, Editor"
                required
              />
            </div>

            {/* Role Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                value={newRoleV2.description}
                onChange={(e) => setNewRoleV2({ ...newRoleV2, description: e.target.value })}
                placeholder="Brief role description"
                required
              />
            </div>

            {/* Permissions Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Permissions
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  value={permissionSearchForRole}
                  onChange={(e) => handlePermissionSearchForRole(e.target.value)}
                  placeholder="Search permissions..."
                />
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                {showPermissionForRoleDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {isSearchingPermissionsForRole ? (
                      <div className="p-3 text-center">
                        <div className="inline-flex items-center text-sm">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </div>
                      </div>
                    ) : searchedPermissionsForRole.length > 0 ? (
                      searchedPermissionsForRole.map(permission => (
                        <div
                          key={permission.id}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => selectPermissionForRole(permission)}
                        >
                          <div className="font-medium text-gray-900 text-sm">{permission.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{permission.description}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        {permissionSearchForRole.length === 0 
                          ? "Start typing to search..."
                          : permissionSearchForRole.length < 2 
                            ? "Type at least 2 characters..."
                            : `No permissions found`
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Permissions - Compact Display */}
          {newRoleV2.permissionIds.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Selected ({newRoleV2.permissionIds.length})</span>
                <button
                  type="button"
                  onClick={() => setNewRoleV2({ ...newRoleV2, permissionIds: [] })}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {newRoleV2.permissionIds.map(permissionId => {
                  const permission = permissions.find(p => p.id === permissionId);
                  return permission ? (
                    <span 
                      key={permissionId} 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {permission.name}
                      <button
                        type="button"
                        className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-blue-600 hover:bg-blue-200 transition-colors"
                        onClick={() => removePermissionFromRole(permissionId)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end pt-3 border-t border-gray-200">
            <button 
              type="submit" 
              disabled={loading || !newRoleV2.name || !newRoleV2.description}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Role'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Roles List Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Existing Roles ({roles.length})
            </h2>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Filter roles..."
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button 
                onClick={fetchRoles} 
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {roles.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No roles found</h3>
              <p className="mt-2 text-gray-500">Get started by creating your first role.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map(role => (
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
                            <span 
                              key={permission.id} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {permission.name}
                            </span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{role.permissions.length - 3} more
                            </span>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;