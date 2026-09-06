/**
 * Input Component
 * 
 * A reusable input component with label, error state, and various types.
 * Supports text, email, password, and search inputs with consistent styling.
 * 
 * @example
 * <Input
 *   label="Email Address"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error="Please enter a valid email"
 *   required
 * />
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  required,
  ...props
}) => {
  const inputClasses = [
    'w-full px-3 py-2 border rounded-lg transition-all text-sm bg-white',
    'focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500',
    error
      ? 'border-red-300 focus:ring-red-500/10 focus:border-red-500'
      : 'border-slate-300',
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    className,
  ].join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-2.5 text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          className={inputClasses}
          required={required}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-2.5 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
