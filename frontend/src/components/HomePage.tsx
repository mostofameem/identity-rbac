import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { config } from '../config/env';
import PageLayout from './layout/PageLayout';

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { user, hasResourcePermission } = useAuth();

  // Helper functions to check for specific permission patterns
  const hasRolePermission = (): boolean => {
    return hasResourcePermission('role') || hasResourcePermission('permission');
  };

  const hasUserPermission = (): boolean => {
    return hasResourcePermission('user');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <PageLayout title="Welcome to Event Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Welcome to Event Management">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
          <p className="text-gray-600">
            Welcome back, {user?.email}. Use the sidebar to navigate through the application.
          </p>

          {/* Debug: Show user permissions */}
          {user?.permissions && user.permissions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Your Permissions:</h4>
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((permission, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Role Management */}
              {hasRolePermission() && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-blue-800">Role Management</h4>
                  <p className="text-sm text-blue-600 mt-1">Manage user roles and permissions</p>
                  <Link
                    to="/roles"
                    className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Roles →
                  </Link>
                </div>
              )}

              {/* User Management */}
              {hasUserPermission() && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-green-800">User Management</h4>
                  <p className="text-sm text-green-600 mt-1">Manage system users and access</p>
                  <Link
                    to="/users"
                    className="inline-block mt-3 text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    View Users →
                  </Link>
                </div>
              )}

              {/* Permissions */}
              {hasRolePermission() && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-purple-800">Permissions</h4>
                  <p className="text-sm text-purple-600 mt-1">Configure fine-grained access controls</p>
                  <Link
                    to="/permissions"
                    className="inline-block mt-3 text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    View Permissions →
                  </Link>
                </div>
              )}

              {/* Customer Portal */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 hover:shadow-md transition-shadow">
                <h4 className="font-medium text-indigo-800">Customer Portal</h4>
                <p className="text-sm text-indigo-600 mt-1">Browse and join ongoing events</p>
                <a
                  href={config.customerPortalUrl}
                  className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium no-underline"
                >
                  Explore Events →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default HomePage;
