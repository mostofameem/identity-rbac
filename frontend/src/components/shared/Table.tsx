/**
 * Table Component
 *
 * A reusable table component with sorting, skeleton loading, empty state, and
 * responsive design. Supports custom column definitions and row rendering.
 *
 * @example
 * const columns = [
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'email', label: 'Email' },
 *   { key: 'actions', label: 'Actions', width: '100px' }
 * ];
 *
 * <Table
 *   columns={columns}
 *   data={users}
 *   renderRow={(user) => (
 *     <tr key={user.id}>
 *       <td>{user.name}</td>
 *       <td>{user.email}</td>
 *       <td><Button>Edit</Button></td>
 *     </tr>
 *   )}
 * />
 */

import React from 'react';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Column[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
}

function Table<T>({
  columns,
  data,
  renderRow,
  emptyMessage = 'No data available',
  loading = false,
  onSort,
  sortKey,
  sortOrder,
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-6 py-4" style={{ width: column.width }}>
                    <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4">
                      <div
                        className="h-4 rounded bg-slate-100 animate-pulse"
                        style={{ width: `${60 + ((i * 13) % 30)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-12 text-center">
          <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-primary-50">
            <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-900">No data found</p>
          <p className="mt-1.5 text-sm text-slate-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div
                    className={`flex items-center ${
                      column.align === 'center'
                        ? 'justify-center'
                        : column.align === 'right'
                          ? 'justify-end'
                          : 'justify-start'
                    }`}
                  >
                    {column.label}
                    {column.sortable && (
                      <div className="ml-2">
                        {sortKey === column.key ? (
                          <svg
                            className={`h-4 w-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
