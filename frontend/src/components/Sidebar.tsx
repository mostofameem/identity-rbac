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
  Category as CategoryIcon,
  Launch as LaunchIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { IconButton, Tooltip, Avatar } from '@mui/material';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { pathname } = useLocation();
  const { user, hasResourcePermission, logout } = useAuth();

  const hasUserPermission = (): boolean => {
    return hasResourcePermission('user');
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getNavItemClass = (path: string) => {
    const active = isActive(path);
    return `
      flex items-center px-4 py-2.5 mx-2 rounded-lg
      transition-all duration-200 group relative
      ${collapsed ? 'justify-center' : ''}
      ${active
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
      }
    `;
  };

  const iconClass = `${collapsed ? '' : 'mr-3'} transition-transform duration-200 group-hover:scale-110`;

  return (
    <div
      className={`
        ${collapsed ? 'w-20' : 'w-64'} 
        bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
        text-white h-screen fixed left-0 top-0 overflow-y-auto z-50 
        transition-all duration-300 hidden sm:block 
        shadow-2xl border-r border-gray-700/50
      `}
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between backdrop-blur-sm">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <EventIcon fontSize="small" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Event Mgmt
            </h1>
          </div>
        )}
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }
          }}
        >
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </div>

      {/* Navigation */}
      <nav className="mt-4 pb-4">
        <div className="space-y-1">
          {/* Home */}
          <Tooltip title={collapsed ? 'Home' : ''} placement="right">
            <Link to="/" className={getNavItemClass('/')}>
              <HomeIcon fontSize="small" className={iconClass} />
              {!collapsed && <span className="font-medium">Home</span>}
              {isActive('/') && !collapsed && (
                <div className="ml-auto w-1 h-6 bg-blue-400 rounded-full"></div>
              )}
            </Link>
          </Tooltip>

          {/* User Management */}
          {hasUserPermission() && (
            <Tooltip title={collapsed ? 'Users' : ''} placement="right">
              <Link to="/users" className={getNavItemClass('/users')}>
                <PeopleIcon fontSize="small" className={iconClass} />
                {!collapsed && <span className="font-medium">Users</span>}
                {isActive('/users') && !collapsed && (
                  <div className="ml-auto w-1 h-6 bg-blue-400 rounded-full"></div>
                )}
              </Link>
            </Tooltip>
          )}

          {/* Role Management */}
          {hasResourcePermission('role') && (
            <Tooltip title={collapsed ? 'Roles' : ''} placement="right">
              <Link to="/roles" className={getNavItemClass('/roles')}>
                <SecurityIcon fontSize="small" className={iconClass} />
                {!collapsed && <span className="font-medium">Roles</span>}
                {isActive('/roles') && !collapsed && (
                  <div className="ml-auto w-1 h-6 bg-blue-400 rounded-full"></div>
                )}
              </Link>
            </Tooltip>
          )}

          {/* Permission Management */}
          {hasResourcePermission('permission', 'view') && (
            <Tooltip title={collapsed ? 'Permissions' : ''} placement="right">
              <Link to="/permissions" className={getNavItemClass('/permissions')}>
                <VpnKeyIcon fontSize="small" className={iconClass} />
                {!collapsed && <span className="font-medium">Permissions</span>}
                {isActive('/permissions') && !collapsed && (
                  <div className="ml-auto w-1 h-6 bg-blue-400 rounded-full"></div>
                )}
              </Link>
            </Tooltip>
          )}

          {/* Events */}
          <Tooltip title={collapsed ? 'Events' : ''} placement="right">
            <Link to="/events" className={getNavItemClass('/events')}>
              <EventIcon fontSize="small" className={iconClass} />
              {!collapsed && <span className="font-medium">Events</span>}
              {isActive('/events') && !collapsed && (
                <div className="ml-auto w-1 h-6 bg-blue-400 rounded-full"></div>
              )}
            </Link>
          </Tooltip>

          {/* Event Types */}
          <Tooltip title={collapsed ? 'Event Types' : ''} placement="right">
            <Link to="/event-types" className={getNavItemClass('/event-types')}>
              <CategoryIcon fontSize="small" className={iconClass} />
              {!collapsed && <span className="font-medium">Event Types</span>}
              {isActive('/event-types') && !collapsed && (
                <div className="ml-auto w-1 h-6 bg-blue-400 rounded-full"></div>
              )}
            </Link>
          </Tooltip>

          {/* Customer Portal */}
          <div className={`mt-6 pt-4 border-t border-gray-700/50 ${collapsed ? 'px-2' : 'px-4'}`}>
            {!collapsed && (
              <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                External
              </p>
            )}
            <Tooltip title={collapsed ? 'Customer Portal' : ''} placement="right">
              <a
                href={config.customerPortalUrl}
                className="
                  flex items-center px-4 py-2.5 mx-2 rounded-lg
                  text-gray-300 hover:bg-gray-700/50 hover:text-white
                  transition-all duration-200 group
                  no-underline
                "
              >
                <LaunchIcon fontSize="small" className={iconClass} />
                {!collapsed && <span className="font-medium">Customer Portal</span>}
              </a>
            </Tooltip>
          </div>
        </div>
      </nav>

      {/* User Section & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        {!collapsed && (
          <div className="flex items-center mb-3 px-2 py-2 rounded-lg bg-gray-800/50">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '0.875rem'
              }}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <div className="ml-3 flex-1 min-w-0">
              <div className="font-medium text-white text-sm truncate">{user?.email}</div>
              <div className="text-xs text-gray-400">Admin</div>
            </div>
          </div>
        )}
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <button
            onClick={logout}
            className={`
              w-full bg-gradient-to-r from-red-600 to-red-700 
              hover:from-red-700 hover:to-red-800
              text-white font-medium py-2.5 rounded-lg 
              transition-all duration-200 
              flex items-center justify-center
              shadow-lg hover:shadow-xl
              ${collapsed ? 'px-0' : 'px-4'}
            `}
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

