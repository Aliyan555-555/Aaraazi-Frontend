/**
 * WorkspaceToolbar Component
 * PHASE 5.1: Core Template System ✅
 * 
 * PURPOSE:
 * Action bar below search with bulk actions, view mode switcher, and tools.
 * Appears when data exists, provides quick access to workspace actions.
 * 
 * UX LAWS:
 * - Fitts's Law: Large action buttons (40x40px min)
 * - Miller's Law: Max 5 visible bulk actions
 * - Hick's Law: Progressive disclosure (more actions in dropdown)
 * - Jakob's Law: Familiar toolbar pattern
 * 
 * LAYOUT:
 * [Bulk Actions] [Selection Count]  |  [View Mode] [Filter Toggle] [Column Customizer]
 */

import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  MoreHorizontal,
  X,
  Filter,
  Columns,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ViewModeSwitcher } from './ViewModeSwitcher';
import { BulkAction } from './WorkspacePageTemplate';

export interface WorkspaceToolbarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Total number of items on current page */
  totalCount: number;
  /** Bulk actions available (max 5 visible) */
  bulkActions?: BulkAction[];
  /** Current view mode */
  viewMode: 'table' | 'grid' | 'kanban';
  /** Callback when view mode changes */
  onViewModeChange: (mode: 'table' | 'grid' | 'kanban') => void;
  /** Available view modes */
  availableViews?: Array<'table' | 'grid' | 'kanban'>;
  /** Show column customizer button (table view only) */
  showColumnCustomizer?: boolean;
  /** Callback to toggle filter panel */
  onToggleFilters?: () => void;
  /** Callback to toggle column customizer */
  onToggleColumnCustomizer?: () => void;
  /** Callback to clear selection */
  onClearSelection?: () => void;
}

export const WorkspaceToolbar = React.memo<WorkspaceToolbarProps>(({
  selectedCount,
  totalCount,
  bulkActions = [],
  viewMode,
  onViewModeChange,
  availableViews = ['table', 'grid'],
  showColumnCustomizer = false,
  onToggleFilters,
  onToggleColumnCustomizer,
  onClearSelection,
}) => {
  const hasSelection = selectedCount > 0;

  // Miller's Law: Max 5 visible actions, rest in dropdown
  const MAX_VISIBLE_ACTIONS = 5;
  const visibleActions = bulkActions.slice(0, MAX_VISIBLE_ACTIONS);
  const hiddenActions = bulkActions.slice(MAX_VISIBLE_ACTIONS);

  return (
    <div className="border-b bg-white px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Bulk Actions */}
        <div className="flex items-center gap-3">
          {hasSelection ? (
            <>
              {/* Selection Count Badge */}
              <Badge variant="secondary" className="px-3 py-1.5">
                {selectedCount} selected
              </Badge>

              {/* Visible Bulk Actions (Fitts's Law: 40x40px min) */}
              {visibleActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => {
                    // Get selected IDs - this will be passed from parent
                    // For now, just call the action
                    action.onClick([]);
                  }}
                  disabled={action.disabled}
                  className="h-10 min-w-[40px]"
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}

              {/* Hidden Actions in Dropdown (Hick's Law: Progressive disclosure) */}
              {hiddenActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 min-w-[40px]">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {hiddenActions.map((action) => (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={() => action.onClick([])}
                        disabled={action.disabled}
                        className={action.variant === 'destructive' ? 'text-red-600' : ''}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Clear Selection */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-10"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </>
          ) : (
            <div className="text-sm text-gray-600">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>

        {/* Right Side: View Controls */}
        <div className="flex items-center gap-3">
          {/* Filter Toggle */}
          {onToggleFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFilters}
              className="h-10"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}

          {/* Column Customizer (Table view only) */}
          {showColumnCustomizer && onToggleColumnCustomizer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleColumnCustomizer}
              className="h-10"
            >
              <Columns className="h-4 w-4 mr-2" />
              Columns
            </Button>
          )}

          {/* View Mode Switcher */}
          <ViewModeSwitcher
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            availableViews={availableViews}
          />
        </div>
      </div>
    </div>
  );
});

WorkspaceToolbar.displayName = 'WorkspaceToolbar';
