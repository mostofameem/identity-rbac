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

import React, { useState } from 'react';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header className="bg-white shadow z-40">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 truncate">{title}</h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600 truncate">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {headerAction}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
