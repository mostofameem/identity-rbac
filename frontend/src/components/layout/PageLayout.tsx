/**
 * PageLayout Component
 * 
 * Enhanced layout with modern design system
 * Features: Gradient background, shadow on scroll, responsive design
 */

import React, { useState, useEffect } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Add scroll listener for header shadow
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsScrolled(target.scrollTop > 10);
    };

    const mainElement = document.querySelector('main');
    mainElement?.addEventListener('scroll', handleScroll);

    return () => {
      mainElement?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex overflow-hidden">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header
          className={`
            bg-white/80 backdrop-blur-md z-40 transition-all duration-200
            ${isScrolled ? 'shadow-lg' : 'shadow-sm'}
            ${!headerAction ? 'hidden' : ''}
          `}
        >
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center">
              <div className="flex items-center space-x-4 ml-4">
                {headerAction}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
