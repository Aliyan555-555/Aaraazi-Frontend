import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSearchBar, QuickFilter, SortOption } from './WorkspaceSearchBar';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { WorkspaceContent } from './WorkspaceContent';
import { WorkspaceFooter } from './WorkspaceFooter';
import { WorkspaceEmptyState, EmptyStatePreset } from './WorkspaceEmptyState';

// ==================== TYPE DEFINITIONS ====================

/**
 * Column definition for table view
 */
export interface Column<T> {
  id: string;
  label: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
}

/**
 * Kanban column definition
 */
export interface KanbanColumn {
  id: string;
  label: string;
  color?: string;
  count?: number;
}

/**
 * Bulk action definition
 */
export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  enabled: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
}

/**
 * Main template props
 */
export interface WorkspacePageTemplateProps<T> {
  // ==================== HEADER ====================
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Stats to display in header (max 5 - Miller's Law) */
  stats?: Array<{
    label: string;
    value: number | string;
    variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
    icon?: React.ReactNode;
  }>;

  // ==================== ACTIONS ====================
  /** Primary action button (top-right, 44x44px min - Fitts's Law) */
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  /** Secondary actions (max 3 visible - Hick's Law) */
  secondaryActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }>;
  /** Bulk actions when items selected (max 5 - Miller's Law) */
  bulkActions?: BulkAction[];

  // ==================== DATA ====================
  /** Array of items to display */
  items: T[];
  /** Loading state */
  isLoading?: boolean;
  /** Function to extract unique ID from item */
  getItemId: (item: T) => string;

  // ==================== VIEW CONFIGURATION ====================
  /** Default view mode */
  defaultView?: 'table' | 'grid' | 'kanban';
  /** Available view modes */
  availableViews?: Array<'table' | 'grid' | 'kanban'>;

  // ==================== SEARCH & FILTER ====================
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Quick filters (max 7 - Miller's Law) */
  quickFilters?: QuickFilter[];
  /** Sort options */
  sortOptions?: SortOption[];
  /** Custom search function */
  onSearch?: (item: T, query: string) => boolean;
  /** Custom filter function */
  onFilter?: (item: T, filters: Map<string, any>) => boolean;
  /** Custom sort function */
  onSort?: (items: T[], sortBy: string, order: 'asc' | 'desc') => T[];

  // ==================== RENDER FUNCTIONS ====================
  /** Render card for grid view */
  renderCard?: (item: T, index: number) => React.ReactNode;
  /** Render table row */
  renderTableRow?: (item: T, index: number) => React.ReactNode;
  /** Render kanban card */
  renderKanbanCard?: (item: T, index: number) => React.ReactNode;

  // ==================== TABLE CONFIGURATION ====================
  /** Table columns (max 7 default visible - Miller's Law) */
  columns?: Column<T>[];

  // ==================== KANBAN CONFIGURATION ====================
  /** Kanban columns (max 7 - Miller's Law) */
  kanbanColumns?: KanbanColumn[];
  /** Function to get kanban column for item */
  getKanbanColumn?: (item: T) => string;

  // ==================== CALLBACKS ====================
  /** Called when item is clicked */
  onItemClick?: (item: T) => void;
  /** Called when export is requested */
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;

  // ==================== PAGINATION ====================
  /** Pagination configuration */
  pagination?: PaginationConfig;

  // ==================== EMPTY STATES ====================
  /** Empty state preset (no data) */
  emptyStatePreset?: EmptyStatePreset;
  /** Custom empty state */
  customEmptyState?: React.ReactNode;
  /** No results state (after filter) */
  noResultsState?: React.ReactNode;
}

// ==================== MAIN COMPONENT ====================

/**
 * WorkspacePageTemplate - Main template component
 * Memoized for performance
 */
const WorkspacePageTemplateInner = React.memo(<T,>({
  // Header
  title,
  description,
  stats = [],

  // Actions
  primaryAction,
  secondaryActions = [],
  bulkActions = [],

  // Data
  items,
  isLoading = false,
  getItemId,

  // View
  defaultView = 'grid',
  availableViews = ['table', 'grid'],

  // Search & Filter
  searchPlaceholder = 'Search...',
  quickFilters = [],
  sortOptions = [],
  onSearch,
  onFilter,
  onSort,

  // Render
  renderCard,
  renderTableRow,
  renderKanbanCard,

  // Table
  columns = [],

  // Kanban
  kanbanColumns = [],
  getKanbanColumn,

  // Callbacks
  onItemClick,
  onExport,

  // Pagination
  pagination = { enabled: true, pageSize: 24, pageSizeOptions: [12, 24, 48, 96] },

  // Empty states
  emptyStatePreset,
  customEmptyState,
  noResultsState,
}: WorkspacePageTemplateProps<T>) => {
  // ==================== STATE MANAGEMENT ====================

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban'>(defaultView);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Map<string, any>>(new Map());
  const [sortBy, setSortBy] = useState(sortOptions[0]?.value || '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination.pageSize || 24);

  // UI
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);

  // ==================== EFFECTS ====================

  /**
   * Sync quickFilters values to activeFilters Map
   * This allows the template to apply filtering based on filter state
   */
  useEffect(() => {
    const newActiveFilters = new Map<string, any>();

    quickFilters.forEach(filter => {
      if (filter.value) {
        // Only add to activeFilters if value is not empty
        if (Array.isArray(filter.value)) {
          if (filter.value.length > 0) {
            newActiveFilters.set(filter.id, filter.value);
          }
        } else if (filter.value !== '') {
          newActiveFilters.set(filter.id, filter.value);
        }
      }
    });

    setActiveFilters(newActiveFilters);
  }, [quickFilters]);

  // ==================== DATA PROCESSING ====================

  /**
   * Enhance quickFilters with internal state management
   */
  const enhancedQuickFilters = useMemo(() => {
    return quickFilters.map(filter => ({
      ...filter,
      value: activeFilters.get(filter.id) || (filter.multiple ? [] : ''),
      onChange: (value: any) => {
        setActiveFilters(prev => {
          const next = new Map(prev);
          next.set(filter.id, value);
          return next;
        });
        setCurrentPage(1);
      }
    }));
  }, [quickFilters, activeFilters]);

  /**
   * Filter items based on search query
   */
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    if (onSearch) {
      return items.filter(item => onSearch(item, searchQuery));
    }

    // Default search (convert to string and search)
    return items.filter(item => {
      const itemString = JSON.stringify(item).toLowerCase();
      return itemString.includes(searchQuery.toLowerCase());
    });
  }, [items, searchQuery, onSearch]);

  /**
   * Filter items based on active filters
   */
  const filteredItems = useMemo(() => {
    if (activeFilters.size === 0) return searchedItems;

    if (onFilter) {
      return searchedItems.filter(item => onFilter(item, activeFilters));
    }

    // Default filtering (basic key-value matching)
    return searchedItems.filter(item => {
      for (const [key, value] of activeFilters.entries()) {
        const itemValue = (item as any)[key];
        if (Array.isArray(value)) {
          if (!value.includes(itemValue)) return false;
        } else {
          if (itemValue !== value) return false;
        }
      }
      return true;
    });
  }, [searchedItems, activeFilters, onFilter]);

  /**
   * Sort filtered items
   */
  const sortedItems = useMemo(() => {
    if (!sortBy) return filteredItems;

    if (onSort) {
      return onSort([...filteredItems], sortBy, sortOrder);
    }

    // Default sorting
    return [...filteredItems].sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortBy, sortOrder, onSort]);

  /**
   * Paginate sorted items
   */
  const paginatedItems = useMemo(() => {
    if (!pagination.enabled) return sortedItems;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedItems.slice(start, end);
  }, [sortedItems, currentPage, pageSize, pagination.enabled]);

  /**
   * Calculate total pages
   */
  const totalPages = useMemo(() => {
    if (!pagination.enabled) return 1;
    return Math.ceil(sortedItems.length / pageSize);
  }, [sortedItems.length, pageSize, pagination.enabled]);

  // ==================== EVENT HANDLERS ====================

  /**
   * Handle search query change
   */
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page
  }, []);

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  /**
   * Handle clear all filters
   */
  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setActiveFilters(new Map());
    setSortBy(sortOptions[0]?.value || '');
    setCurrentPage(1);
  }, [sortOptions]);

  /**
   * Handle view mode change
   */
  const handleViewModeChange = useCallback((mode: 'table' | 'grid' | 'kanban') => {
    setViewMode(mode);
  }, []);

  /**
   * Handle item selection
   */
  const handleSelectItem = useCallback((itemId: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  /**
   * Handle select all
   */
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(paginatedItems.map(getItemId)));
    } else {
      setSelectedIds(new Set());
    }
  }, [paginatedItems, getItemId]);

  /**
   * Handle clear selection
   */
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedIds(new Set()); // Clear selection on page change
  }, []);

  /**
   * Handle page size change
   */
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  // ==================== RENDER LOGIC ====================

  // Check if we have data
  const hasData = items.length > 0;
  const hasResults = filteredItems.length > 0;
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkspaceHeader
        title={title}
        description={description}
        stats={stats}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        availableViews={availableViews}
      />

      {/* Search Bar */}
      <WorkspaceSearchBar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        placeholder={searchPlaceholder}
        quickFilters={enhancedQuickFilters}
        sortOptions={sortOptions}
        sortValue={sortBy}
        onSortChange={handleSortChange}
        onClearAll={handleClearAll}
      />

      {/* Toolbar (when data exists) */}
      {hasData && (
        <WorkspaceToolbar
          selectedCount={selectedIds.size}
          totalCount={paginatedItems.length}
          bulkActions={bulkActions}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          availableViews={availableViews}
          showColumnCustomizer={viewMode === 'table' && columns.length > 0}
          onToggleFilters={() => setShowFilterPanel(!showFilterPanel)}
          onToggleColumnCustomizer={() => setShowColumnCustomizer(!showColumnCustomizer)}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Main Content */}
      <div className={viewMode === 'kanban' ? 'px-6 pt-6 pb-0' : 'p-6'}>
        {!hasData ? (
          // No data at all - show empty state
          customEmptyState || (
            emptyStatePreset && <WorkspaceEmptyState {...emptyStatePreset} />
          )
        ) : !hasResults ? (
          // No results after filtering - show no results state
          noResultsState || (
            <WorkspaceEmptyState
              variant="no-results"
              title="No results found"
              description="Try adjusting your search or filters"
              primaryAction={{
                label: 'Clear Filters',
                onClick: handleClearAll,
              }}
            />
          )
        ) : (
          // Has results - show content
          <WorkspaceContent
            viewMode={viewMode}
            items={paginatedItems}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            getItemId={getItemId}
            onItemClick={onItemClick}
            // Table props
            columns={columns}
            renderTableRow={renderTableRow}
            // Grid props
            renderCard={renderCard}
            // Kanban props
            kanbanColumns={kanbanColumns}
            getKanbanColumn={getKanbanColumn}
            renderKanbanCard={renderKanbanCard}
          />
        )}
      </div>

      {/* Footer with Pagination */}
      {hasResults && pagination.enabled && (
        <div className={viewMode === 'kanban' ? 'px-6 pb-6' : ''}>
          <WorkspaceFooter
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={pagination.pageSizeOptions || [12, 24, 48, 96]}
            totalItems={sortedItems.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
})

export const WorkspacePageTemplate = WorkspacePageTemplateInner as <T>(props: WorkspacePageTemplateProps<T>) => React.ReactElement;
(WorkspacePageTemplate as any).displayName = 'WorkspacePageTemplate';