import React, { useState, useEffect } from 'react';
import { adminApiClient } from '../services';
import { User, Role } from '../types/admin';

interface UserManagementProps {
  showMessage: (message: string, isError?: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ showMessage, loading, setLoading }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [newUser, setNewUser] = useState({ email: '', roleIds: [] as number[] });
  const [userFilter, setUserFilter] = useState('');

  // User-Role Assignment State
  const [userRoleSearch, setUserRoleSearch] = useState('');
  const [searchedUsersForRole, setSearchedUsersForRole] = useState<User[]>([]);
  const [showUserRoleDropdown, setShowUserRoleDropdown] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [isSearchingUsersForRole, setIsSearchingUsersForRole] = useState(false);
  
  const [roleSearchForUser, setRoleSearchForUser] = useState('');
  const [searchedRolesForUser, setSearchedRolesForUser] = useState<Role[]>([]);
  const [showRoleForUserDropdown, setShowRoleForUserDropdown] = useState(false);
  const [selectedRoleForUser, setSelectedRoleForUser] = useState<Role | null>(null);
  const [isSearchingRolesForUser, setIsSearchingRolesForUser] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Debounced user search for role assignment
  useEffect(() => {
    if (userRoleSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsersForRole(userRoleSearch);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [userRoleSearch]);

  // Debounced role search for user assignment
  useEffect(() => {
    if (roleSearchForUser.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchRolesForUser(roleSearchForUser);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [roleSearchForUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getUsers(userFilter);
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
      const response = await adminApiClient.getRoles('');
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
    
    if (selectedUserForRole && value !== selectedUserForRole.email) {
      setSelectedUserForRole(null);
    }
    
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
    
    if (selectedRoleForUser && value !== selectedRoleForUser.name) {
      setSelectedRoleForUser(null);
    }
    
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">User Management</h2>
        <p className="text-blue-100">Manage users and their role assignments</p>
      </div>

      {/* Add User Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-primary">Add New User</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter user email"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Roles</span>
              </label>
              <select
                multiple
                className="select select-bordered h-32"
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
                <div className="mt-4">
                  <span className="label-text font-semibold">Selected Roles:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newUser.roleIds.map(roleId => {
                      const role = roles.find(r => r.id === roleId);
                      return role ? (
                        <div key={roleId} className="badge badge-primary gap-2">
                          {role.name}
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              setNewUser({
                                ...newUser,
                                roleIds: newUser.roleIds.filter(id => id !== roleId)
                              });
                            }}
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
              {loading ? <span className="loading loading-spinner"></span> : 'Add User'}
            </button>
          </form>
        </div>
      </div>

      {/* Assign Role to User Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-secondary">Assign Role to User</h3>
          <form onSubmit={handleAssignRoleToUser} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">User</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={userRoleSearch}
                  onChange={(e) => handleUserRoleSearch(e.target.value)}
                  placeholder="Search user by email..."
                  required
                />
                {showUserRoleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingUsersForRole ? (
                      <div className="p-4 text-center">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="ml-2">Searching users...</span>
                      </div>
                    ) : searchedUsersForRole.length > 0 ? (
                      searchedUsersForRole.map(user => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                          onClick={() => selectUserForRole(user)}
                        >
                          <div className="font-semibold">{user.email}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-base-content/60">
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
                <div className="mt-2 p-2 bg-success/10 rounded-lg">
                  <span className="text-success font-semibold">Selected: {selectedUserForRole.email}</span>
                </div>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Role</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={roleSearchForUser}
                  onChange={(e) => handleRoleSearchForUser(e.target.value)}
                  placeholder="Search role by name..."
                  required
                />
                {showRoleForUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingRolesForUser ? (
                      <div className="p-4 text-center">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="ml-2">Searching roles...</span>
                      </div>
                    ) : searchedRolesForUser.length > 0 ? (
                      searchedRolesForUser.map(role => (
                        <div
                          key={role.id}
                          className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                          onClick={() => selectRoleForUser(role)}
                        >
                          <div className="font-semibold">{role.name}</div>
                          <div className="text-sm text-base-content/60">{role.description}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-base-content/60">
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
                <div className="mt-2 p-2 bg-success/10 rounded-lg">
                  <span className="text-success font-semibold">Selected: {selectedRoleForUser.name}</span>
                </div>
              )}
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-secondary w-full">
              {loading ? <span className="loading loading-spinner"></span> : 'Assign Role'}
            </button>
          </form>
        </div>
      </div>

      {/* Users List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="card-title">Users</h3>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Filter by email"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
              <button onClick={fetchUsers} className="btn btn-outline btn-sm">
                Filter
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Roles</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="font-semibold">{user.email}</td>
                    <td>
                      <div className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td>
                      {user.roles && user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map(role => (
                            <div key={role.id} className="badge badge-outline badge-sm">
                              {role.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-base-content/60">No roles</span>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
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

export default UserManagement;
