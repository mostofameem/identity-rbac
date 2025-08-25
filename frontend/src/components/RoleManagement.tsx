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
      setLoading(true);
      const response = await adminApiClient.getPermissions('');
      const permissions = response.data.data || [];
      setPermissions(permissions);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch permissions', true);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

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

  const searchPermissionsForRole = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchedPermissionsForRole([]);
      setShowPermissionForRoleDropdown(false);
      setIsSearchingPermissionsForRole(false);
      return;
    }

    try {
      setIsSearchingPermissionsForRole(true);
      const response = await adminApiClient.getPermissions(searchTerm);
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
    
    if (value.length === 0) {
      setSearchedPermissionsForRole([]);
      setShowPermissionForRoleDropdown(false);
    } else if (value.length >= 1) {
      setShowPermissionForRoleDropdown(true);
      if (value.length < 2) {
        setSearchedPermissionsForRole([]);
      }
    }
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Role Management</h2>
        <p className="text-blue-100">Create and manage roles with permissions</p>
      </div>

      {/* Add Role with Permissions Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-primary">Add New Role with Permissions</h3>
          <form onSubmit={handleAddRoleV2} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={newRoleV2.name}
                onChange={(e) => setNewRoleV2({ ...newRoleV2, name: e.target.value })}
                placeholder="Enter role name"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={newRoleV2.description}
                onChange={(e) => setNewRoleV2({ ...newRoleV2, description: e.target.value })}
                placeholder="Enter role description"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Permissions</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={permissionSearchForRole}
                  onChange={(e) => handlePermissionSearchForRole(e.target.value)}
                  placeholder="Search permissions by name..."
                />
                {showPermissionForRoleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingPermissionsForRole ? (
                      <div className="p-4 text-center">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="ml-2">Searching permissions...</span>
                      </div>
                    ) : searchedPermissionsForRole.length > 0 ? (
                      searchedPermissionsForRole.map(permission => (
                        <div
                          key={permission.id}
                          className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                          onClick={() => selectPermissionForRole(permission)}
                        >
                          <div className="font-semibold">{permission.name}</div>
                          <div className="text-sm text-base-content/60">{permission.description}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-base-content/60">
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
                <div className="mt-4">
                  <span className="label-text font-semibold">Selected Permissions:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newRoleV2.permissionIds.map(permissionId => {
                      const permission = permissions.find(p => p.id === permissionId);
                      return permission ? (
                        <div key={permissionId} className="badge badge-primary gap-2 p-3">
                          {permission.name}
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-white hover:text-error"
                            onClick={() => removePermissionFromRole(permissionId)}
                            title="Remove permission"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <span className="loading loading-spinner"></span> : 'Create Role'}
            </button>
          </form>
        </div>
      </div>

      {/* Roles List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="card-title">Roles</h3>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Filter by name"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
              <button onClick={fetchRoles} className="btn btn-outline btn-sm">
                Filter
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id}>
                    <td className="font-semibold">{role.name}</td>
                    <td>{role.description}</td>
                    <td>
                      {role.permissions && role.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map(permission => (
                            <div key={permission.id} className="badge badge-outline badge-sm">
                              {permission.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-base-content/60">No permissions</span>
                      )}
                    </td>
                    <td>{new Date(role.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
