import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { config } from '../config/env';
import services from '../pages/events/services/eventService';
import PageLayout from './layout/PageLayout';
import PageHeader from './PageHeader';
import {
  Security as SecurityIcon,
  People as PeopleIcon,
  VpnKey as VpnKeyIcon,
  Launch as LaunchIcon,
  Event as EventIcon,
  Bolt as BoltIcon,
  Category as CategoryIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

interface Stats {
  totalEvents: number | null;
  ongoingEvents: number | null;
  eventTypes: number | null;
}

const HomePage: React.FC = () => {
  const { user, hasResourcePermission } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalEvents: null,
    ongoingEvents: null,
    eventTypes: null,
  });

  const hasRolePermission = () =>
    hasResourcePermission('role') || hasResourcePermission('permission');
  const hasUserPermission = () => hasResourcePermission('user');

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      const results = await Promise.allSettled([
        services.event.getEvents({ page: 1, limit: 1 }),
        services.event.getEvents({ page: 1, limit: 1, status: 'ONGOING' }),
        services.eventType.getEventTypes({ page: 1, limit: 1 }),
      ]);
      if (cancelled) return;
      setStats({
        totalEvents: results[0].status === 'fulfilled' ? results[0].value.total : null,
        ongoingEvents: results[1].status === 'fulfilled' ? results[1].value.total : null,
        eventTypes: results[2].status === 'fulfilled' ? results[2].value.total : null,
      });
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const statTiles = [
    { label: 'Total events', value: stats.totalEvents, icon: <EventIcon />, to: '/events', tone: 'indigo' },
    { label: 'Ongoing now', value: stats.ongoingEvents, icon: <BoltIcon />, to: '/events', tone: 'emerald' },
    { label: 'Event types', value: stats.eventTypes, icon: <CategoryIcon />, to: '/event-types', tone: 'violet' },
  ] as const;

  const toneClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  interface QuickItem {
    title: string;
    description: string;
    cta: string;
    ctaClass: string;
    tile: string;
    icon: React.ReactNode;
    to?: string;
    href?: string;
  }

  const quickAccess: QuickItem[] = [
    ...(hasRolePermission()
      ? [{
          to: '/roles',
          icon: <SecurityIcon />,
          tile: 'bg-indigo-50 text-indigo-600',
          title: 'Role Management',
          description: 'Manage user roles and permissions',
          cta: 'View roles',
          ctaClass: 'text-indigo-600',
        }]
      : []),
    ...(hasUserPermission()
      ? [{
          to: '/users',
          icon: <PeopleIcon />,
          tile: 'bg-emerald-50 text-emerald-600',
          title: 'User Management',
          description: 'Manage system users and access',
          cta: 'View users',
          ctaClass: 'text-emerald-600',
        }]
      : []),
    ...(hasRolePermission()
      ? [{
          to: '/permissions',
          icon: <VpnKeyIcon />,
          tile: 'bg-violet-50 text-violet-600',
          title: 'Permissions',
          description: 'Configure fine-grained access controls',
          cta: 'View permissions',
          ctaClass: 'text-violet-600',
        }]
      : []),
    {
      href: config.customerPortalUrl,
      icon: <LaunchIcon />,
      tile: 'bg-sky-50 text-sky-600',
      title: 'Customer Portal',
      description: 'Browse and join ongoing events',
      cta: 'Explore events',
      ctaClass: 'text-sky-600',
    },
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle={`${greeting} — manage your events and team with ease`} />

        {/* Welcome banner */}
        <div className="relative overflow-hidden bg-brand-gradient rounded-2xl p-8 text-white shadow-raised">
          <div
            aria-hidden
            className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-32 left-1/3 w-72 h-72 rounded-full bg-violet-400/20 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-indigo-100 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statTiles.map((tile) => (
            <Link
              key={tile.label}
              to={tile.to}
              className="group bg-white rounded-xl border border-slate-200 shadow-soft hover:shadow-card hover:border-indigo-200 transition-all duration-200 p-5 no-underline hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className={`w-10 h-10 rounded-[10px] grid place-items-center ${toneClasses[tile.tone]}`}>
                  {tile.icon}
                </span>
                <ArrowForwardIcon
                  sx={{ fontSize: 16 }}
                  className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <div className="mt-4 text-[30px] leading-8 font-semibold text-slate-900">
                {tile.value === null ? <span className="inline-block w-10 h-7 rounded bg-slate-100 animate-pulse align-middle" /> : tile.value}
              </div>
              <div className="text-sm text-slate-500 mt-1">{tile.label}</div>
            </Link>
          ))}
        </div>

        {/* Permissions */}
        {user?.permissions && user.permissions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
              <VpnKeyIcon sx={{ fontSize: 16 }} className="mr-2 text-indigo-500" />
              Your permissions
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((permission, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick access */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Quick access</h3>
          <p className="text-sm text-slate-500 mb-4">Navigate to key areas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickAccess.map((item) => {
              const inner = (
                <>
                  <div className={`w-11 h-11 rounded-[10px] grid place-items-center mb-4 ${item.tile}`}>
                    {item.icon}
                  </div>
                  <h4 className="font-semibold text-slate-900 text-base mb-1.5">{item.title}</h4>
                  <p className="text-sm text-slate-500 mb-4">{item.description}</p>
                  <div className={`flex items-center font-medium text-sm group-hover:translate-x-1 transition-transform duration-200 ${item.ctaClass}`}>
                    {item.cta}
                    <ArrowForwardIcon sx={{ fontSize: 15 }} className="ml-1" />
                  </div>
                </>
              );

              return item.to ? (
                <Link
                  key={item.title}
                  to={item.to}
                  className="group bg-white rounded-xl border border-slate-200 shadow-soft hover:shadow-card hover:border-indigo-200 transition-all duration-200 p-5 no-underline hover:-translate-y-0.5"
                >
                  {inner}
                </Link>
              ) : (
                <a
                  key={item.title}
                  href={item.href}
                  className="group bg-white rounded-xl border border-slate-200 shadow-soft hover:shadow-card hover:border-indigo-200 transition-all duration-200 p-5 no-underline hover:-translate-y-0.5"
                >
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default HomePage;
