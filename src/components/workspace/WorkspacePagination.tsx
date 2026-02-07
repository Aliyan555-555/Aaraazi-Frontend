/**
 * WorkspacePagination Component
 * PHASE 5.2: Enhanced View Components ✅
 * 
 * PURPOSE:
 * Standalone, reusable pagination component for workspaces.
 * Can be used independently or as part of WorkspaceFooter.
 * 
 * FEATURES:
 * - Page navigation (first, prev, next, last)
 * - Page number buttons (max 7 visible)
 * - Page size selector
 * - Item count display
 * - Jump to page (future)
 * - Keyboard navigation
 * - WCAG 2.1 AA compliant
 * 
 * UX LAWS:
 * - Miller's Law: Max 7 visible page numbers
 * - Fitts's Law: 40x40px minimum buttons
 * - Jakob's Law: Center-aligned pagination (familiar pattern)
 * - Aesthetic-Usability: Clean, professional design
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
import { cn } from '../../lib/utils';

export interface WorkspacePaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page size */
  pageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Total number of items */
  totalItems?: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Show item count */
  showItemCount?: boolean;
  /** Compact mode (smaller buttons) */
  compact?: boolean;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * WorkspacePagination - Standalone pagination component
 * Memoized for performance
 */
export const WorkspacePagination = React.memo<WorkspacePaginationProps>(({
  currentPage,
  totalPages,
  pageSize = 24,
  pageSizeOptions = [12, 24, 48, 96],
  totalItems,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  showItemCount = true,
  compact = false,
  align = 'center',
}) => {
  // Calculate item range
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  // Calculate visible page numbers (Miller's Law: max 7)
  const getVisiblePages = (): (number | 'ellipsis')[] => {
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
        if (i > 0 && i <= totalPages) {
          pages.push(i);
        }
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Button size
  const buttonSize = compact ? 'h-8 w-8' : 'h-10 w-10';

  // Navigation handlers
  const goToFirstPage = () => onPageChange(1);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => onPageChange(totalPages);

  // Container alignment
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={cn('flex items-center gap-4 flex-wrap', alignmentClasses[align])}>
      {/* Left: Item count and page size */}
      {(showItemCount || showPageSize) && (
        <div className="flex items-center gap-4">
          {/* Item count */}
          {showItemCount && totalItems !== undefined && (
            <div className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span>
            </div>
          )}

          {/* Page size selector */}
          {showPageSize && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>Per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
              >
                <SelectTrigger className="w-20 h-9">
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
          )}
        </div>
      )}

      {/* Center: Pagination controls */}
      <nav
        className="flex items-center gap-1"
        role="navigation"
        aria-label="Pagination"
      >
        {/* First page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          className={cn(buttonSize, 'p-0')}
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
          className={cn(buttonSize, 'p-0')}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div
                key={`ellipsis-${index}`}
                className="px-2 text-gray-400"
                style={{ fontSize: compact ? 'var(--text-sm)' : 'var(--text-base)' }}
                aria-hidden="true"
              >
                ...
              </div>
            );
          }

          const isCurrentPage = currentPage === page;

          return (
            <Button
              key={page}
              variant={isCurrentPage ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(buttonSize, 'p-0')}
              aria-label={`Go to page ${page}`}
              aria-current={isCurrentPage ? 'page' : undefined}
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
          className={cn(buttonSize, 'p-0')}
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
          className={cn(buttonSize, 'p-0')}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </nav>

      {/* Right: Page info (optional) */}
      {!compact && (
        <div className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>
          Page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </div>
      )}
    </div>
  );
});

WorkspacePagination.displayName = 'WorkspacePagination';

// ==================== COMPACT PAGINATION (Mobile-friendly) ====================

export interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * CompactPagination - Minimal pagination for mobile
 */
export const CompactPagination = React.memo<CompactPaginationProps>(({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <div className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>
        {currentPage} / {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
});

CompactPagination.displayName = 'CompactPagination';

// ==================== SIMPLE PAGINATION (Minimal) ====================

export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
}

/**
 * SimplePagination - Minimal pagination (prev/next only)
 */
export const SimplePagination = React.memo<SimplePaginationProps>(({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = false,
}) => {
  return (
    <div className="flex items-center gap-1">
      {showFirstLast && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-9 w-9 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-9 w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="px-4 text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>
        {currentPage} / {totalPages}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showFirstLast && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-9 w-9 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

SimplePagination.displayName = 'SimplePagination';
