/**
 * PageLayout Component
 *
 * Admin shell: fixed Sidebar + scrollable content column on a slate canvas.
 * One max-width constraint (1200px) — pages must not nest their own.
 */

import React, { useState } from 'react';
import Sidebar from '../Sidebar';

export interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
