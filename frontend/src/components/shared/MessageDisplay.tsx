/**
 * MessageDisplay Component
 * 
 * A component for displaying success, error, and informational messages.
 * Automatically dismisses after a specified time and supports manual dismissal.
 * 
 * @example
 * <MessageDisplay
 *   message="User created successfully"
 *   type="success"
 *   onDismiss={() => setMessage('')}
 * />
 */

import React, { useEffect } from 'react';

export interface MessageDisplayProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onDismiss: () => void;
  autoHideDuration?: number;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  message,
  type,
  onDismiss,
  autoHideDuration = 5000,
}) => {
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(onDismiss, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [onDismiss, autoHideDuration]);

  const typeStyles = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    error: 'bg-red-50 border-red-100 text-red-800',
    info: 'bg-sky-50 border-sky-100 text-sky-800',
    warning: 'bg-amber-50 border-amber-100 text-amber-800',
  };

  const iconMap = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  };

  if (!message) return null;

  return (
    <div className={`border rounded-lg p-4 mb-4 ${typeStyles[type]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            {iconMap[type]}
          </div>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          className="flex-shrink-0 ml-4 text-current hover:opacity-75"
          onClick={onDismiss}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageDisplay;
