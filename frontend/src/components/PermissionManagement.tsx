import React, { useState, useEffect } from 'react';
import { adminApiClient } from '../services';
import { Permission, Role } from '../types/admin';

interface PermissionManagementProps {
  showMessage: (message: string, isError?: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const PermissionManagement: React.FC<PermissionManagementProps> = ({ showMessage, loading, setLoading }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newPermission, setNewPermission] = useState({ name: '', description: '' });
  const [permissionFilter, setPermissionFilter] = useState('');

  // Permission Search State
  const [permissionSearch, setPermissionSearch] = useState('');
  const [searchedPermissions, setSearchedPermissions] = useState<Permission[]>([]);
  const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isSearchingPermissions, setIsSearchingPermissions] = useState(false);

  // Role Search State for Permission Assignment
  const [roleSearch, setRoleSearch] = useState('');
  const [searchedRoles, setSearchedRoles] = useState<Role[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSearchingRoles, setIsSearchingRoles] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Debounced permission search
  useEffect(() => {
    if (permissionSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchPermissions(permissionSearch);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [permissionSearch]);

  // Debounced role search
  useEffect(() => {
    if (roleSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchRoles(roleSearch);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [roleSearch]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getPermissions(permissionFilter);
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
    
    if (selectedPermission && value !== selectedPermission.name) {
      setSelectedPermission(null);
    }
    
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
    
    if (selectedRole && value !== selectedRole.name) {
      setSelectedRole(null);
    }
    
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
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Permission Management</h2>
        <p className="text-blue-100">Create and manage system permissions</p>
      </div>

      {/* Add Permission Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-primary">Add New Permission</h3>
          <form onSubmit={handleAddPermission} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={newPermission.name}
                onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                placeholder="Enter permission name"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={newPermission.description}
                onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                placeholder="Enter permission description"
                required
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <span className="loading loading-spinner"></span> : 'Create Permission'}
            </button>
          </form>
        </div>
      </div>

      {/* Assign Permission to Role Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-secondary">Assign Permission to Role</h3>
          <form onSubmit={handleAssignPermissionToRole} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Role</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={roleSearch}
                  onChange={(e) => handleRoleSearch(e.target.value)}
                  placeholder="Search role by name..."
                  required
                />
                {showRoleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingRoles ? (
                      <div className="p-4 text-center">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="ml-2">Searching roles...</span>
                      </div>
                    ) : searchedRoles.length > 0 ? (
                      searchedRoles.map(role => (
                        <div
                          key={role.id}
                          className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                          onClick={() => selectRole(role)}
                        >
                          <div className="font-semibold">{role.name}</div>
                          <div className="text-sm text-base-content/60">{role.description}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-base-content/60">
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
                <div className="mt-2 p-2 bg-success/10 rounded-lg">
                  <span className="text-success font-semibold">Selected: {selectedRole.name}</span>
                </div>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Permission</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={permissionSearch}
                  onChange={(e) => handlePermissionSearch(e.target.value)}
                  placeholder="Search permission by name..."
                  required
                />
                {showPermissionDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingPermissions ? (
                      <div className="p-4 text-center">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="ml-2">Searching permissions...</span>
                      </div>
                    ) : searchedPermissions.length > 0 ? (
                      searchedPermissions.map(permission => (
                        <div
                          key={permission.id}
                          className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                          onClick={() => selectPermission(permission)}
                        >
                          <div className="font-semibold">{permission.name}</div>
                          <div className="text-sm text-base-content/60">{permission.description}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-base-content/60">
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
                <div className="mt-2 p-2 bg-success/10 rounded-lg">
                  <span className="text-success font-semibold">Selected: {selectedPermission.name}</span>
                </div>
              )}
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-secondary w-full">
              {loading ? <span className="loading loading-spinner"></span> : 'Assign Permission'}
            </button>
          </form>
        </div>
      </div>

      {/* Permissions List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="card-title">Permissions</h3>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Filter by name"
                value={permissionFilter}
                onChange={(e) => setPermissionFilter(e.target.value)}
              />
              <button onClick={fetchPermissions} className="btn btn-outline btn-sm">
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
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(permission => (
                  <tr key={permission.id}>
                    <td className="font-semibold">{permission.name}</td>
                    <td>{permission.description}</td>
                    <td>{new Date(permission.createdAt).toLocaleDateString()}</td>
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

export default PermissionManagement;
