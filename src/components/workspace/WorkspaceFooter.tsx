/**
 * WorkspaceFooter Component
 * PHASE 5.1: Core Template System ✅
 * 
 * PURPOSE:
 * Footer with pagination controls and summary stats.
 * Provides navigation through large datasets.
 * 
 * UX LAWS:
 * - Jakob's Law: Familiar pagination pattern (center-aligned)
 * - Fitts's Law: Large page buttons (40x40px min)
 * - Miller's Law: Max 7 visible page numbers
 * 
 * FEATURES:
 * - Page navigation
 * - Page size selection
 * - Total item count
 * - Jump to page
 */

import React from 'react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface WorkspaceFooterProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page size */
  pageSize: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Total number of items */
  totalItems: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
}

export const WorkspaceFooter = React.memo<WorkspaceFooterProps>(({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [12, 24, 48, 96],
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  // Calculate item range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Calculate visible page numbers (Miller's Law: max 7)
  const getVisiblePages = () => {
    const MAX_VISIBLE = 7;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= MAX_VISIBLE) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      // Adjust if at start
      if (currentPage <= 3) {
        end = 5;
      }

      // Adjust if at end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('ellipsis');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Handler functions
  const goToFirstPage = () => onPageChange(1);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => onPageChange(totalPages);

  return (
    <div className="bg-white border-t px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Item count and page size */}
        <div className="flex items-center gap-4">
          <div className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> items
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>Items per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Center: Pagination */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="h-10 w-10 p-0"
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-10 w-10 p-0"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          {visiblePages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </div>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="h-10 w-10 p-0"
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            );
          })}

          {/* Next page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="h-10 w-10 p-0"
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="h-10 w-10 p-0"
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Page info */}
        <div className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>
          Page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </div>
      </div>
    </div>
  );
});

WorkspaceFooter.displayName = 'WorkspaceFooter';
