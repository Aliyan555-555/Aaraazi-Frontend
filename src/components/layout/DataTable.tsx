/**
 * DataTable - Standardized table component for detail pages
 * 
 * Features:
 * - Consistent header styling
 * - Row hover states
 * - Optional row click
 * - Empty state
 * - Loading state
 * - Responsive (horizontal scroll on mobile)
 * 
 * Usage:
 * <DataTable
 *   title="All Offers"
 *   columns={[
 *     { header: 'Date', accessor: 'date' },
 *     { header: 'Amount', accessor: 'amount', render: (row) => formatPKR(row.amount) }
 *   ]}
 *   data={offers}
 *   onRowClick={(row) => viewOffer(row.id)}
 *   emptyMessage="No offers yet"
 * />
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface DataTableColumn<T = any> {
  header: string;
  accessor: string;
  render?: (row: T) => React.ReactNode;
  className?: string; // For column-specific styling
}

export interface DataTableProps<T = any> {
  title?: string;
  headerAction?: React.ReactNode; // Button or action in header
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  title,
  headerAction,
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      {(title || headerAction) && (
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {title && <h3 className="text-base">{title}</h3>}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${
                    onRowClick
                      ? 'cursor-pointer hover:bg-gray-50 transition-colors'
                      : ''
                  }`}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-3 text-sm ${column.className || ''}`}
                    >
                      {column.render
                        ? column.render(row)
                        : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
