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
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-indigo-100 text-indigo-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-gray-400',
    primary: 'bg-blue-400',
    success: 'bg-green-400',
    danger: 'bg-red-400',
    warning: 'bg-yellow-400',
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
