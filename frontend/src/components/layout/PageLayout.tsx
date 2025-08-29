/**
 * PageLayout Component
 * 
 * A layout wrapper that provides consistent page structure with sidebar,
 * header, and main content area. Handles responsive behavior automatically.
 * 
 * @example
 * <PageLayout title="User Management" subtitle="Manage system users">
 *   <UserManagement />
 * </PageLayout>
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../Sidebar';

export interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  children,
  headerAction,
}) => {
  const { user } = useAuth();

  return (
    <div className="h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-0 sm:ml-64 h-full overflow-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {headerAction}
                <span className="text-sm text-gray-600">
                  Welcome, {user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
