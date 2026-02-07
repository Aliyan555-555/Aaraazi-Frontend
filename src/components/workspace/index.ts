/**
 * Workspace Components - Central Exports
 * 
 * Components for workspace/listing pages
 * Phase 4, 5.1, 5.2, 5.3: Complete workspace template system
 */

// ==================== PHASE 4 COMPONENTS (Existing) ====================
export { WorkspaceHeader } from './WorkspaceHeader';
export type { WorkspaceHeaderProps } from './WorkspaceHeader';

export { WorkspaceSearchBar } from './WorkspaceSearchBar';
export type { WorkspaceSearchBarProps, QuickFilter, SortOption } from './WorkspaceSearchBar';

export { WorkspaceEmptyState, EmptyStatePresets } from './WorkspaceEmptyState';
export type { WorkspaceEmptyStateProps, EmptyStatePreset } from './WorkspaceEmptyState';

// ==================== PHASE 5.1 COMPONENTS (Core Template System) ====================

// Main Template
export { WorkspacePageTemplate } from './WorkspacePageTemplate';
export type { 
  WorkspacePageTemplateProps,
  Column,
  KanbanColumn,
  BulkAction,
  PaginationConfig,
} from './WorkspacePageTemplate';

// Core Components
export { WorkspaceToolbar } from './WorkspaceToolbar';
export type { WorkspaceToolbarProps } from './WorkspaceToolbar';

export { WorkspaceContent } from './WorkspaceContent';
export type { WorkspaceContentProps } from './WorkspaceContent';

export { WorkspaceFooter } from './WorkspaceFooter';
export type { WorkspaceFooterProps } from './WorkspaceFooter';

export { ViewModeSwitcher } from './ViewModeSwitcher';
export type { ViewModeSwitcherProps } from './ViewModeSwitcher';

// ==================== PHASE 5.2 COMPONENTS (Enhanced View Components) ====================

// Enhanced View Components
export { WorkspaceTableView } from './views/WorkspaceTableView';
export type { WorkspaceTableViewProps } from './views/WorkspaceTableView';

export { WorkspaceGridView, getGridColumns } from './views/WorkspaceGridView';
export type { WorkspaceGridViewProps } from './views/WorkspaceGridView';

export { WorkspaceKanbanView } from './views/WorkspaceKanbanView';
export type { WorkspaceKanbanViewProps } from './views/WorkspaceKanbanView';

// Pagination Components
export { 
  WorkspacePagination,
  CompactPagination,
  SimplePagination 
} from './WorkspacePagination';
export type { 
  WorkspacePaginationProps,
  CompactPaginationProps,
  SimplePaginationProps 
} from './WorkspacePagination';

// ==================== PHASE 5.3 COMPONENTS (Data Display Components) ====================

// Card Components
export { 
  WorkspaceCard,
  WorkspaceCardSkeleton,
  WorkspaceCardEmpty 
} from './cards/WorkspaceCard';
export type { 
  WorkspaceCardProps,
  WorkspaceCardSkeletonProps,
  WorkspaceCardEmptyProps 
} from './cards/WorkspaceCard';

export { 
  WorkspaceKanbanCard,
  WorkspaceKanbanCardSkeleton 
} from './cards/WorkspaceKanbanCard';
export type { WorkspaceKanbanCardProps } from './cards/WorkspaceKanbanCard';

// Action Components
export { 
  BulkActionBar,
  CompactBulkActionBar 
} from './BulkActionBar';
export type { 
  BulkActionBarProps,
  CompactBulkActionBarProps 
} from './BulkActionBar';

export { 
  QuickActionMenu,
  QuickActionPresets,
  InlineActions 
} from './QuickActionMenu';
export type { 
  QuickActionMenuProps,
  QuickAction,
  InlineActionsProps 
} from './QuickActionMenu';