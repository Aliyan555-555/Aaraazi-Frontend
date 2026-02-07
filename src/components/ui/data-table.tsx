/**
 * DataTable - Advanced table component for ERP applications
 * 
 * Features:
 * - Sortable columns
 * - Selectable rows (checkbox)
 * - Pagination
 * - Loading skeleton
 * - Empty state
 * - Sticky header
 * - Row hover actions
 * - Responsive design
 * - Keyboard navigation
 * 
 * Usage:
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   selectable
 *   onRowClick={handleRowClick}
 *   onSelectionChange={setSelectedRows}
 * />
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Checkbox } from './checkbox';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

// Column definition
export interface DataTableColumn<T = any> {
  id: string;
  header: string | ((props: { table: DataTableState<T> }) => React.ReactNode);
  accessorKey?: keyof T;
  cell?: (props: { row: T; index: number }) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Table state
export interface DataTableState<T> {
  data: T[];
  selectedRows: Set<number>;
  toggleAllRows: () => void;
  getIsAllRowsSelected: () => boolean;
  getIsSomeRowsSelected: () => boolean;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  selectable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedIndices: number[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  compact?: boolean;
  /** Accessible label for the table */
  ariaLabel?: string;
}

export function DataTable<T = any>({
  columns,
  data,
  selectable = false,
  pagination = true,
  pageSize: initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  onSelectionChange,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  stickyHeader = true,
  compact = false,
  ariaLabel,
}: DataTableProps<T>) {
  // State
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    const column = columns.find(c => c.id === sortColumn);
    if (!column || !column.accessorKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[column.accessorKey as keyof T];
      const bValue = b[column.accessorKey as keyof T];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize, pagination]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, sortedData.length);

  // Selection handlers
  const toggleAllRows = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allIndices = new Set(
        paginatedData.map((_, idx) => (currentPage - 1) * pageSize + idx)
      );
      setSelectedRows(allIndices);
      onSelectionChange?.(Array.from(allIndices));
    }
  };

  const toggleRow = (globalIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(globalIndex)) {
      newSelected.delete(globalIndex);
    } else {
      newSelected.add(globalIndex);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const getIsAllRowsSelected = () => {
    return paginatedData.length > 0 && selectedRows.size === paginatedData.length;
  };

  const getIsSomeRowsSelected = () => {
    return selectedRows.size > 0 && selectedRows.size < paginatedData.length;
  };

  // Sort handler
  const handleSort = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column?.sortable) return;

    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Table state for custom header/cell renderers
  const tableState: DataTableState<T> = {
    data: paginatedData,
    selectedRows,
    toggleAllRows,
    getIsAllRowsSelected,
    getIsSomeRowsSelected,
  };

  // Render loading skeleton
  if (loading) {
    return (
      <div className={`rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <table className="w-full">
          <thead className={`bg-gray-50 border-b-2 border-gray-200 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {selectable && (
                <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} w-12`}>
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.id}
                  className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-left text-sm font-medium text-gray-700`}
                  style={{ width: column.width }}
                >
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                {selectable && (
                  <td className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                )}
                {columns.map(column => (
                  <td key={column.id} className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Render empty state
  if (paginatedData.length === 0) {
    return (
      <div className={`rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <table className="w-full">
          <thead className={`bg-gray-50 border-b-2 border-gray-200 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {selectable && (
                <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} w-12`}></th>
              )}
              {columns.map(column => (
                <th
                  key={column.id}
                  className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-left text-sm font-medium text-gray-700`}
                  style={{ width: column.width }}
                >
                  {typeof column.header === 'function'
                    ? column.header({ table: tableState })
                    : column.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="py-12 text-center text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label={ariaLabel}>
            {/* Header */}
            <thead className={`bg-gray-50 border-b-2 border-gray-200 ${stickyHeader ? 'sticky top-0 z-10 bg-gray-50' : ''}`}>
              <tr>
                {/* Selection column */}
                {selectable && (
                  <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} w-12`}>
                    <Checkbox
                      checked={getIsAllRowsSelected()}
                      indeterminate={getIsSomeRowsSelected()}
                      onCheckedChange={toggleAllRows}
                      aria-label="Select all rows"
                    />
                  </th>
                )}

                {/* Data columns */}
                {columns.map(column => (
                  <th
                    key={column.id}
                    className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-left text-sm font-medium text-gray-700 ${
                      column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 transition-colors' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className={`flex items-center gap-2 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                      {typeof column.header === 'function'
                        ? column.header({ table: tableState })
                        : column.header}
                      
                      {/* Sort indicator */}
                      {column.sortable && (
                        <span className="text-gray-400">
                          {sortColumn === column.id ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-4 h-4" />
                            ) : (
                              <ArrowDown className="w-4 h-4" />
                            )
                          ) : (
                            <ArrowUpDown className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {paginatedData.map((row, localIdx) => {
                const globalIdx = (currentPage - 1) * pageSize + localIdx;
                const isSelected = selectedRows.has(globalIdx);

                return (
                  <tr
                    key={globalIdx}
                    className={`border-b border-gray-200 transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                    } ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => onRowClick?.(row, globalIdx)}
                  >
                    {/* Selection column */}
                    {selectable && (
                      <td className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(e) => {
                            e.stopPropagation();
                            toggleRow(globalIdx);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select row ${globalIdx + 1}`}
                        />
                      </td>
                    )}

                    {/* Data columns */}
                    {columns.map(column => (
                      <td
                        key={column.id}
                        className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-sm text-gray-900 ${
                          column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                        }`}
                      >
                        {column.cell
                          ? column.cell({ row, index: globalIdx })
                          : column.accessorKey
                          ? String(row[column.accessorKey as keyof T] ?? '')
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-b-lg">
          {/* Row count */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>
              Showing {startRow} to {endRow} of {sortedData.length} results
            </span>
            {selectedRows.size > 0 && (
              <span className="text-blue-600">
                ({selectedRows.size} selected)
              </span>
            )}
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map(size => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}