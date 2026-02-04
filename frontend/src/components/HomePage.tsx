import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { config } from '../config/env';
import PageLayout from './layout/PageLayout';
import {
  Security as SecurityIcon,
  People as PeopleIcon,
  VpnKey as VpnKeyIcon,
  Launch as LaunchIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { user, hasResourcePermission } = useAuth();

  const hasRolePermission = (): boolean => {
    return hasResourcePermission('role') || hasResourcePermission('permission');
  };

  const hasUserPermission = (): boolean => {
    return hasResourcePermission('user');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <PageLayout title="Welcome to Event Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Welcome to Event Management">
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
              <p className="text-blue-100 text-lg">{user?.email}</p>
              <p className="text-blue-200 text-sm mt-1">Manage your events and team with ease</p>
            </div>
            <div className="hidden md:block">
              <TrendingUpIcon sx={{ fontSize: 80, opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Permissions Badge */}
        {user?.permissions && user.permissions.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <VpnKeyIcon fontSize="small" className="mr-2 text-blue-600" />
              Your Permissions
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((permission, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Access Section */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            Quick Access
            <span className="ml-2 text-sm font-normal text-gray-500">Navigate to key areas</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Role Management */}
            {hasRolePermission() && (
              <Link
                to="/roles"
                className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 no-underline transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
                <div className="p-6 relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <SecurityIcon className="text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg mb-2">Role Management</h4>
                  <p className="text-sm text-gray-600 mb-4">Manage user roles and permissions</p>
                  <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
                    View Roles
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}

            {/* User Management */}
            {hasUserPermission() && (
              <Link
                to="/users"
                className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200 no-underline transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
                <div className="p-6 relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <PeopleIcon className="text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg mb-2">User Management</h4>
                  <p className="text-sm text-gray-600 mb-4">Manage system users and access</p>
                  <div className="flex items-center text-green-600 font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
                    View Users
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}

            {/* Permissions */}
            {hasRolePermission() && (
              <Link
                to="/permissions"
                className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 no-underline transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
                <div className="p-6 relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <VpnKeyIcon className="text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg mb-2">Permissions</h4>
                  <p className="text-sm text-gray-600 mb-4">Configure fine-grained access controls</p>
                  <div className="flex items-center text-purple-600 font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
                    View Permissions
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}

            {/* Customer Portal */}
            <a
              href={config.customerPortalUrl}
              className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 no-underline transform hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="p-6 relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <LaunchIcon className="text-white" />
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-2">Customer Portal</h4>
                <p className="text-sm text-gray-600 mb-4">Browse and join ongoing events</p>
                <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
                  Explore Events
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default HomePage;
