/**
 * Card Component
 * 
 * A reusable card container with optional header, footer, and different variants.
 * Provides consistent styling and spacing for content sections.
 * 
 * @example
 * <Card title="User Settings" subtitle="Manage your account">
 *   <p>Card content goes here</p>
 * </Card>
 * 
 * <Card variant="elevated">
 *   <p>Elevated card content</p>
 * </Card>
 */

import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  variant = 'default',
  className = '',
  headerAction,
  footer,
}) => {
  const variantClasses = {
    default: 'bg-white rounded-lg shadow-md border border-gray-200',
    elevated: 'bg-white rounded-lg shadow-lg border border-gray-200',
    outlined: 'bg-white rounded-lg border-2 border-gray-300',
  };

  const cardClasses = [
    variantClasses[variant],
    className,
  ].join(' ');

  return (
    <div className={cardClasses}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-gray-800">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="px-6 py-4">
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
