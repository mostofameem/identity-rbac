/**
 * Badge Component
 * 
 * A small status indicator component with different variants and sizes.
 * Used for showing status, categories, or tags.
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger" size="sm">Inactive</Badge>
 * <Badge variant="info" dot>Online</Badge>
 */

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-600 border border-slate-200',
    primary: 'bg-primary-50 text-primary-700 border border-primary-100',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    danger: 'bg-red-50 text-red-700 border border-red-100',
    warning: 'bg-amber-50 text-amber-800 border border-amber-100',
    info: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-primary-400',
    success: 'bg-emerald-400',
    danger: 'bg-red-400',
    warning: 'bg-amber-400',
    info: 'bg-indigo-400',
  };

  const badgeClasses = [
    'inline-flex items-center font-medium rounded-full',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(' ');

  return (
    <span className={badgeClasses}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
