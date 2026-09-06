import React from 'react';
import { Skeleton, Table, TableBody, TableCell, TableHead, TablePagination, TableRow } from '@mui/material';
import EmptyState from './EmptyState';

// Shared table shell: bordered rounded Paper-free surface (parent supplies the
// wrapper), sticky uppercase header, skeleton loading rows, polished empty
// state, and optional server-side pagination. The colSpan for
// loading/empty rows is derived from the column list — no more mismatches.

export interface DataTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
}

interface DataTableProps<T> {
  columns: DataTableColumn[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  renderRow: (row: T, index: number) => React.ReactNode;
  loading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  page?: number;
  rowsPerPage?: number;
  count?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
}

function DataTable<T>(props: DataTableProps<T>) {
  const {
    columns,
    rows,
    rowKey,
    renderRow,
    loading = false,
    skeletonRows = 5,
    emptyTitle = 'Nothing here yet',
    emptyDescription,
    emptyAction,
    onRowClick,
    page,
    rowsPerPage,
    count,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions,
  } = props;

  const hasPagination =
    page !== undefined && rowsPerPage !== undefined && count !== undefined && onPageChange;

  return (
    <>
      <Table stickyHeader aria-label="data table">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align} width={col.width}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col, j) => (
                    <TableCell key={col.key} align={col.align}>
                      <Skeleton
                        height={20}
                        width={j === 0 ? '70%' : `${Math.max(20, 80 - j * 12)}%`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 0 }}>
                      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} size="small" />
                    </TableCell>
                  </TableRow>
                )
              : rows.map((row, index) => (
                  <TableRow
                    key={rowKey(row, index)}
                    hover={Boolean(onRowClick)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={onRowClick ? { cursor: 'pointer' } : undefined}
                  >
                    {renderRow(row, index)}
                  </TableRow>
                ))}
        </TableBody>
      </Table>
      {hasPagination && !loading && rows.length > 0 && (
        <TablePagination
          component="div"
          count={count}
          page={page}
          rowsPerPage={rowsPerPage ?? 10}
          rowsPerPageOptions={rowsPerPageOptions ?? [10, 25, 50]}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      )}
    </>
  );
}

export default DataTable;
