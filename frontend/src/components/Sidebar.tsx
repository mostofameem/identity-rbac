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
} from '@mui/icons-material';
import { IconButton, Tooltip, Avatar } from '@mui/material';
import { brandGradient } from '../theme/theme';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { pathname } = useLocation();
  const { user, hasResourcePermission, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  const getNavItemClass = (path: string) => {
    const active = isActive(path);
    return `
      flex items-center px-4 py-2.5 mx-2 rounded-lg relative
      transition-colors duration-200 group
      ${collapsed ? 'justify-center' : ''}
      ${active
        ? 'bg-[rgba(99,102,241,0.16)] text-white'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }
    `;
  };

  const activeBar = (path: string) =>
    isActive(path) ? (
      <span
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-6 rounded-r-full bg-indigo-400"
      />
    ) : null;

  const iconClass = `${collapsed ? '' : 'mr-3'} transition-transform duration-200`;

  return (
    <div
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        bg-sidebar-gradient text-white h-screen fixed left-0 top-0 z-50
        transition-all duration-300 hidden sm:block overflow-y-auto
        shadow-2xl border-r border-white/[0.06]
      `}
    >
      {/* Brand */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        {!collapsed && (
          <Link to="/" className="flex items-center space-x-2.5 no-underline">
            <div className="w-8 h-8 rounded-[10px] bg-brand-gradient flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <EventIcon sx={{ fontSize: 18 }} />
            </div>
            <h1 className="text-[15px] font-semibold text-white tracking-tight m-0">
              Event Mgmt
            </h1>
          </Link>
        )}
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#fff' },
          }}
        >
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </div>

      {/* Navigation */}
      <nav className="mt-4 pb-44">
        <div className="space-y-1">
          <Tooltip title={collapsed ? 'Home' : ''} placement="right">
            <Link to="/" className={getNavItemClass('/')}>
              <HomeIcon fontSize="small" className={iconClass} />
              {!collapsed && <span className="text-sm font-medium">Home</span>}
              {activeBar('/')}
            </Link>
          </Tooltip>

          {hasResourcePermission('user') && (
            <Tooltip title={collapsed ? 'Users' : ''} placement="right">
              <Link to="/users" className={getNavItemClass('/users')}>
                <PeopleIcon fontSize="small" className={iconClass} />
                {!collapsed && <span className="text-sm font-medium">Users</span>}
                {activeBar('/users')}
              </Link>
            </Tooltip>
          )}

          {hasResourcePermission('role') && (
            <Tooltip title={collapsed ? 'Roles' : ''} placement="right">
              <Link to="/roles" className={getNavItemClass('/roles')}>
                <SecurityIcon fontSize="small" className={iconClass} />
                {!collapsed && <span className="text-sm font-medium">Roles</span>}
                {activeBar('/roles')}
              </Link>
            </Tooltip>
          )}

          {hasResourcePermission('permission', 'view') && (
            <Tooltip title={collapsed ? 'Permissions' : ''} placement="right">
              <Link to="/permissions" className={getNavItemClass('/permissions')}>
                <VpnKeyIcon fontSize="small" className={iconClass} />
                {!collapsed && <span className="text-sm font-medium">Permissions</span>}
                {activeBar('/permissions')}
              </Link>
            </Tooltip>
          )}

          <Tooltip title={collapsed ? 'Events' : ''} placement="right">
            <Link to="/events" className={getNavItemClass('/events')}>
              <EventIcon fontSize="small" className={iconClass} />
              {!collapsed && <span className="text-sm font-medium">Events</span>}
              {activeBar('/events')}
            </Link>
          </Tooltip>

          <Tooltip title={collapsed ? 'Event Types' : ''} placement="right">
            <Link to="/event-types" className={getNavItemClass('/event-types')}>
              <CategoryIcon fontSize="small" className={iconClass} />
              {!collapsed && <span className="text-sm font-medium">Event Types</span>}
              {activeBar('/event-types')}
            </Link>
          </Tooltip>

          {/* Customer Portal */}
          <div className={`mt-6 pt-4 border-t border-white/[0.06] ${collapsed ? 'px-0' : 'px-2'}`}>
            {!collapsed && (
              <p className="px-4 text-[0.65rem] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-2">
                External
              </p>
            )}
            <Tooltip title={collapsed ? 'Customer Portal' : ''} placement="right">
              <a
                href={config.customerPortalUrl}
                className="
                  flex items-center px-4 py-2.5 mx-2 rounded-lg
                  text-slate-400 hover:bg-white/5 hover:text-white
                  transition-colors duration-200 group no-underline
                "
              >
                <LaunchIcon fontSize="small" className={iconClass} />
                {!collapsed && <span className="text-sm font-medium">Customer Portal</span>}
              </a>
            </Tooltip>
          </div>
        </div>
      </nav>

      {/* User Section & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06] bg-[#0b1120]/80 backdrop-blur-md">
        {!collapsed && (
          <div className="flex items-center mb-3 px-2 py-2 rounded-lg bg-white/[0.04]">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.8125rem',
                background: brandGradient,
              }}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <div className="ml-3 flex-1 min-w-0">
              <div className="font-medium text-white text-sm truncate">{user?.email}</div>
              <div className="text-xs text-slate-500">Admin</div>
            </div>
          </div>
        )}
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <button
            onClick={logout}
            className={`
              w-full border border-white/10 text-slate-300
              hover:bg-white/5 hover:text-white font-medium py-2.5 rounded-lg
              transition-colors duration-200 text-sm
              flex items-center justify-center
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
