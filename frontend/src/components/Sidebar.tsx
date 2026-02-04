import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config } from '../config/env';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  Event as EventIcon,
  Launch as LaunchIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { pathname } = useLocation();
  const { user, hasResourcePermission, logout } = useAuth();

  // Helper function to check for user permissions
  const hasUserPermission = (): boolean => {
    return hasResourcePermission('user');
  };

  const isActive = (path: string) => {
    return pathname === path ? 'bg-gray-700' : '';
  };

  const navItemClass = `flex items-center px-4 py-2 rounded hover:bg-gray-700 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`;
  const iconClass = `${collapsed ? '' : 'mr-3'}`;

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-gray-800 text-white h-screen fixed left-0 top-0 overflow-y-auto z-50 transition-all duration-300 hidden sm:block shadow-xl`}>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && <h1 className="text-xl font-bold truncate">Event Management</h1>}
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{ color: 'white' }}
          className="hover:bg-gray-700"
        >
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </div>

      <nav className="mt-4">
        <div className={`px-2 ${collapsed ? '' : 'py-2'}`}>
          {/* Home */}
          <Tooltip title={collapsed ? 'Home' : ''} placement="right">
            <Link to="/" className={`${navItemClass} ${isActive('/')}`}>
              <HomeIcon fontSize="small" className={iconClass} />
              {!collapsed && <span>Home</span>}
            </Link>
          </Tooltip>

          {/* User Management */}
          {hasUserPermission() && (
            <Tooltip title={collapsed ? 'Users' : ''} placement="right">
              <Link to="/users" className={`${navItemClass} ${isActive('/users')}`}>
                <PeopleIcon fontSize="small" className={iconClass} />
                {!collapsed && <span>Users</span>}
              </Link>
            </Tooltip>
          )}

          {/* Role Management */}
          {hasResourcePermission('role') && (
            <Tooltip title={collapsed ? 'Roles' : ''} placement="right">
              <Link to="/roles" className={`${navItemClass} ${isActive('/roles')}`}>
                <SecurityIcon fontSize="small" className={iconClass} />
                {!collapsed && <span>Roles</span>}
              </Link>
            </Tooltip>
          )}

          {/* Permission Management */}
          {hasResourcePermission('permission', 'view') && (
            <Tooltip title={collapsed ? 'Permissions' : ''} placement="right">
              <Link to="/permissions" className={`${navItemClass} ${isActive('/permissions')}`}>
                <VpnKeyIcon fontSize="small" className={iconClass} />
                {!collapsed && <span>Permissions</span>}
              </Link>
            </Tooltip>
          )}

          {/* Events */}
          <Tooltip title={collapsed ? 'Events' : ''} placement="right">
            <Link to="/events" className={`${navItemClass} ${isActive('/events')}`}>
              <EventIcon fontSize="small" className={iconClass} />
              {!collapsed && <span>Events</span>}
            </Link>
          </Tooltip>

          {/* Customer Portal */}
          <div className={`mt-4 pt-4 border-t border-gray-700 ${collapsed ? 'flex flex-col items-center' : ''}`}>
            {!collapsed && (
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Portals
              </p>
            )}
            <Tooltip title={collapsed ? 'Customer Portal' : ''} placement="right">
              <a
                href={config.customerPortalUrl}
                className={`${navItemClass} text-white no-underline`}
              >
                <LaunchIcon fontSize="small" className={iconClass} />
                {!collapsed && <span>Customer Portal</span>}
              </a>
            </Tooltip>
          </div>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
        {!collapsed && (
          <div className="flex items-center mb-4 px-2">
            <div className="text-sm text-gray-400 truncate">
              <div className="font-medium text-white truncate">{user?.email}</div>
              <div className="text-xs">Logged in</div>
            </div>
          </div>
        )}
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <button
            onClick={logout}
            className={`w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors duration-200 flex items-center justify-center ${collapsed ? 'px-0' : 'px-4'}`}
          >
            <LogoutIcon fontSize="small" className={collapsed ? '' : 'mr-2'} />
            {!collapsed && <span>Logout</span>}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default Sidebar;
