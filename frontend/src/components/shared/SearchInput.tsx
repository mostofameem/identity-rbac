/**
 * SearchInput Component
 * 
 * A specialized input component for search functionality with debouncing.
 * Includes search icon and clear functionality.
 * 
 * @example
 * <SearchInput
 *   placeholder="Search users..."
 *   onSearch={(value) => handleSearch(value)}
 *   debounceMs={300}
 * />
 */

import React, { useState, useEffect } from 'react';

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  initialValue?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  initialValue = '',
  className = '',
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, onSearch, debounceMs]);

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-2.5 text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <input
        type="text"
        className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-sm bg-white transition-all"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      
      {value && (
        <button
          type="button"
          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
          onClick={handleClear}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchInput;
