import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { user, hasResourcePermission, logout } = useAuth();

  // Helper functions to check for specific permission patterns
  const hasRolePermission = (): boolean => {
    return hasResourcePermission('role') || hasResourcePermission('permission');
  };

  const hasUserPermission = (): boolean => {
    return hasResourcePermission('user');
  };

  const isActive = (path: string) => {
    return pathname === path ? 'bg-gray-700' : '';
  };

  return (
    <div className="w-64 bg-gray-800 text-white h-screen fixed left-0 top-0 overflow-y-auto z-50 hidden sm:block">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">RBAC System</h1>
      </div>
      
      <nav className="mt-4">
        <div className="px-4 py-2">
          <Link 
            to="/" 
            className={`block px-4 py-2 rounded hover:bg-gray-700 ${isActive('/')}`}
          >
            Home
          </Link>
          
          {/* Role Management - Show if user has role or permission related permissions */}
          {hasRolePermission() && (
            <div className="mt-2">
              <div className="text-gray-400 text-sm font-semibold px-4 py-2">
                Role Management
              </div>
              <div className="ml-4 space-y-1">
                <Link 
                  to="/roles" 
                  className={`block px-4 py-2 text-sm rounded hover:bg-gray-700 ${isActive('/roles')}`}
                >
                  View Roles
                </Link>
                <Link 
                  to="/permissions" 
                  className={`block px-4 py-2 text-sm rounded hover:bg-gray-700 ${isActive('/permissions')}`}
                >
                  View Permissions
                </Link>
              </div>
            </div>
          )}

          {/* User Management - Show if user has user related permissions */}
          {hasUserPermission() && (
            <div className="mt-2">
              <div className="text-gray-400 text-sm font-semibold px-4 py-2">
                User Management
              </div>
              <div className="ml-4 space-y-1">
                <Link 
                  to="/users" 
                  className={`block px-4 py-2 text-sm rounded hover:bg-gray-700 ${isActive('/users')}`}
                >
                  View Users
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-400">
            <div className="font-medium text-white">{user?.email}</div>
            <div className="text-xs">Logged in</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
