/**
 * BulkActionBar Component
 * PHASE 5.3: Data Display Components ✅
 * 
 * PURPOSE:
 * Floating action bar that appears when items are selected.
 * Provides bulk operations like delete, export, assign, etc.
 * 
 * FEATURES:
 * - Sticky at bottom of viewport
 * - Slide-in animation
 * - Selection count
 * - Multiple actions (max 5 visible)
 * - Clear selection
 * - Responsive (mobile-friendly)
 * 
 * UX LAWS:
 * - Fitts's Law: Large action buttons (44x44px min)
 * - Miller's Law: Max 5 visible actions
 * - Hick's Law: Progressive disclosure (more in dropdown)
 * - Jakob's Law: Bottom sticky bar (familiar pattern)
 */

import React from 'react';
import { useConfirmStore } from '@/store/useConfirmStore';
import { X, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  requireConfirm?: boolean;
}

export interface BulkActionBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** IDs of selected items */
  selectedIds: string[];
  /** Bulk actions (max 5 visible) */
  actions: BulkAction[];
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Entity name (e.g., "properties", "deals") */
  entityName?: string;
  /** Show animation */
  animate?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * BulkActionBar - Floating action bar for bulk operations
 */
export const BulkActionBar = React.memo<BulkActionBarProps>(({
  selectedCount,
  selectedIds,
  actions,
  onClearSelection,
  entityName = 'items',
  animate = true,
  className,
}) => {
  // Don't render if nothing selected
  if (selectedCount === 0) return null;

  // Miller's Law: Max 5 visible actions, rest in dropdown
  const MAX_VISIBLE_ACTIONS = 4;
  const visibleActions = actions.slice(0, MAX_VISIBLE_ACTIONS);
  const hiddenActions = actions.slice(MAX_VISIBLE_ACTIONS);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white border-t border-gray-200 shadow-lg',
        'py-4 px-6',
        animate && 'animate-in slide-in-from-bottom duration-300',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Selection Count */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-2 text-base">
              {selectedCount} {entityName} selected
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-10"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Selection
            </Button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Visible Actions (Fitts's Law: 44x44px min) */}
            {visibleActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === 'destructive' ? 'destructive' : 'default'}
                size="default"
                onClick={() => {
                  if (action.requireConfirm) {
                    useConfirmStore.getState().ask({
                      title: `Confirm ${action.label}`,
                      description: `Are you sure you want to ${action.label.toLowerCase()} ${selectedCount} ${entityName}?`,
                      confirmText: action.label,
                      variant: action.variant === 'destructive' ? 'destructive' : 'default',
                      onConfirm: () => action.onClick(selectedIds),
                    });
                  } else {
                    action.onClick(selectedIds);
                  }
                }}
                disabled={action.disabled}
                className="min-h-[44px] min-w-[44px]"
              >
                {action.icon && (
                  <>
                    <span className="mr-2 hidden sm:inline">{action.icon}</span>
                    <span className="sm:hidden">{action.icon}</span>
                  </>
                )}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            ))}

            {/* Hidden Actions in Dropdown (Hick's Law: Progressive disclosure) */}
            {hiddenActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="min-h-[44px] min-w-[44px]">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hiddenActions.map((action, index) => (
                    <React.Fragment key={action.id}>
                      {index > 0 && action.variant === 'destructive' && (
                        <DropdownMenuSeparator />
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          if (action.requireConfirm) {
                            useConfirmStore.getState().ask({
                              title: `Confirm ${action.label}`,
                              description: `Are you sure you want to ${action.label.toLowerCase()} ${selectedCount} ${entityName}?`,
                              confirmText: action.label,
                              variant: action.variant === 'destructive' ? 'destructive' : 'default',
                              onConfirm: () => action.onClick(selectedIds),
                            });
                          } else {
                            action.onClick(selectedIds);
                          }
                        }}
                        disabled={action.disabled}
                        className={action.variant === 'destructive' ? 'text-red-600' : ''}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

BulkActionBar.displayName = 'BulkActionBar';

// ==================== COMPACT VARIANT (Mobile) ====================

export interface CompactBulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  actions: BulkAction[];
  onClearSelection: () => void;
}

/**
 * CompactBulkActionBar - Mobile-optimized variant
 */
export const CompactBulkActionBar = React.memo<CompactBulkActionBarProps>(({
  selectedCount,
  selectedIds,
  actions,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedCount}</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {actions.slice(0, 2).map((action) => (
            <Button
              key={action.id}
              variant={action.variant === 'destructive' ? 'destructive' : 'default'}
              size="sm"
              onClick={() => {
                if (action.requireConfirm) {
                  useConfirmStore.getState().ask({
                    title: `Confirm ${action.label}`,
                    description: `Are you sure you want to ${action.label.toLowerCase()} ${selectedCount} items?`,
                    confirmText: action.label,
                    variant: action.variant === 'destructive' ? 'destructive' : 'default',
                    onConfirm: () => action.onClick(selectedIds),
                  });
                } else {
                  action.onClick(selectedIds);
                }
              }}
              disabled={action.disabled}
            >
              {action.icon}
            </Button>
          ))}
          {actions.length > 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.slice(2).map((action) => (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={() => {
                      if (action.requireConfirm) {
                        useConfirmStore.getState().ask({
                          title: `Confirm ${action.label}`,
                          description: `Are you sure you want to ${action.label.toLowerCase()} ${selectedCount} items?`,
                          confirmText: action.label,
                          variant: action.variant === 'destructive' ? 'destructive' : 'default',
                          onConfirm: () => action.onClick(selectedIds),
                        });
                      } else {
                        action.onClick(selectedIds);
                      }
                    }}
                    disabled={action.disabled}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
});

CompactBulkActionBar.displayName = 'CompactBulkActionBar';