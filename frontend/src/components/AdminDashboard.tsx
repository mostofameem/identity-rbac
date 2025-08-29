import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApiClient } from '../services/adminApi';

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

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ email: '', userName: '', roleIds: [] as number[] });
  const [userFilter, setUserFilter] = useState('');

  // Role Management State
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [newRole, setNewRole] = useState({ name: '', description: '', permissionIds: [] as number[] });

  // Permission Management State
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionFilter, setPermissionFilter] = useState('');
  const [newPermission, setNewPermission] = useState({ name: '', description: '' });

  // Search States
  const [permissionSearch, setPermissionSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [searchedPermissions, setSearchedPermissions] = useState<Permission[]>([]);
  const [searchedRoles, setSearchedRoles] = useState<Role[]>([]);
  
  // UI States
  const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isSearchingPermissions, setIsSearchingPermissions] = useState(false);
  const [isSearchingRoles, setIsSearchingRoles] = useState(false);

  // Fetch data based on active section
  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers();
      fetchRoles();
    } else if (activeSection === 'roles') {
      fetchRoles();
      fetchPermissions();
    } else if (activeSection === 'permissions') {
      fetchPermissions();
    }
  }, [activeSection]);

  // API Call Functions
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getUsers(userFilter);
      setUsers(response.data.data || []);
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
      setRoles(response.data.data || []);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch roles', true);
      setRoles([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getPermissions(permissionFilter);
      setPermissions(response.data.data || []);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch permissions', true);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler Functions
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.userName || newUser.roleIds.length === 0) {
      showMessage('Please provide an email, user name and select at least one role', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.addUser({
        email: newUser.email,
        userName: newUser.userName,
        roleIds: newUser.roleIds
      });
      showMessage('User added successfully');
      setNewUser({ email: '', userName: '', roleIds: [] });
      fetchUsers();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to add user', true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name || !newRole.description) {
      showMessage('Please fill in all required fields', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.createRoleV2({
        roleName: newRole.name,
        description: newRole.description,
        permissionIds: newRole.permissionIds
      });
      showMessage('Role created successfully');
      setNewRole({ name: '', description: '', permissionIds: [] });
      fetchRoles();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to create role', true);
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

  const renderUserPanel = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>
      
      <form onSubmit={handleAddUser} className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <input
              type="email"
              placeholder="Enter user email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Enter user name"
              value={newUser.userName}
              onChange={(e) => setNewUser({ ...newUser, userName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : 'Add User'}
          </button>
        </div>
      </form>
      
      {/* Users List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles?.map((role) => (
                        <span 
                          key={role.id} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRolePanel = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Role Management</h2>
      
      {/* Add Role Form */}
      <form onSubmit={handleAddRole} className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <input
              type="text"
              id="roleName"
              placeholder="e.g., admin, editor, viewer"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="roleDescription"
              placeholder="Describe the role's purpose"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : 'Add Role'}
          </button>
        </div>
      </form>
      
      {/* Roles List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{role.name}</div>
                    <div className="text-xs text-gray-500">Created: {new Date(role.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">{role.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {role.permissions?.map((perm) => (
                        <span 
                          key={perm.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {perm.name}
                        </span>
                      )) || (
                        <span className="text-xs text-gray-500">No permissions</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      role.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </span>
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Permission Management</h2>
      
      {/* Add Permission Form */}
      <form onSubmit={handleAddPermission} className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="permissionName" className="block text-sm font-medium text-gray-700 mb-1">
              Permission Name
            </label>
            <input
              type="text"
              id="permissionName"
              placeholder="e.g., user:create, user:read"
              value={newPermission.name}
              onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label htmlFor="permissionDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="permissionDescription"
              placeholder="Describe what this permission allows"
              value={newPermission.description}
              onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : 'Add Permission'}
          </button>
        </div>
      </form>
      
      {/* Permissions List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{permission.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(permission.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-gray-800">
      {/* Header */}
      <header className="bg-white bg-opacity-95 backdrop-blur-sm border-b border-opacity-20 border-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-700">Welcome, {user?.email}</span>
            <button 
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white bg-opacity-80 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveSection('users')}
              className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
                activeSection === 'users'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveSection('roles')}
              className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
                activeSection === 'roles'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Roles
            </button>
            <button
              onClick={() => setActiveSection('permissions')}
              className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
                activeSection === 'permissions'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Permissions
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            {activeSection === 'users' && renderUserPanel()}
            {activeSection === 'roles' && renderRolePanel()}
            {activeSection === 'permissions' && renderPermissionPanel()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
