/**
 * QuickActionMenu Component
 * PHASE 5.3: Data Display Components ✅
 * 
 * PURPOSE:
 * 3-dot menu for contextual actions on cards and table rows.
 * Provides quick access to common actions (view, edit, delete, etc.)
 * 
 * FEATURES:
 * - Dropdown menu
 * - Grouped actions
 * - Icon support
 * - Destructive actions separated
 * - Keyboard navigation
 * - Accessible
 * 
 * UX LAWS:
 * - Miller's Law: Max 7 actions per menu
 * - Hick's Law: Logical grouping
 * - Jakob's Law: 3-dot menu (familiar pattern)
 * - Fitts's Law: 40x40px trigger button
 */

import React from 'react';
import { MoreVertical, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface QuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  separator?: boolean; // Show separator before this item
}

export interface QuickActionMenuProps {
  /** Actions to display (max 7 recommended) */
  actions: QuickAction[];
  /** Icon orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Button variant */
  variant?: 'ghost' | 'outline';
  /** Button size */
  size?: 'sm' | 'default';
  /** Align dropdown */
  align?: 'start' | 'center' | 'end';
  /** Show on hover only */
  showOnHover?: boolean;
  /** Custom trigger */
  trigger?: React.ReactNode;
  /** Custom className */
  className?: string;
}

/**
 * QuickActionMenu - 3-dot contextual menu
 */
export const QuickActionMenu = React.memo<QuickActionMenuProps>(({
  actions,
  orientation = 'vertical',
  variant = 'ghost',
  size = 'sm',
  align = 'end',
  showOnHover = false,
  trigger,
  className,
}) => {
  // Filter out disabled actions or limit to 7 (Miller's Law)
  const visibleActions = actions.slice(0, 7);

  // Don't render if no actions
  if (visibleActions.length === 0) return null;

  const Icon = orientation === 'vertical' ? MoreVertical : MoreHorizontal;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button
            variant={variant}
            size={size}
            className={cn(
              'h-8 w-8 p-0',
              showOnHover && 'opacity-0 group-hover:opacity-100 transition-opacity',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
        {visibleActions.map((action, index) => (
          <React.Fragment key={action.id}>
            {/* Separator */}
            {action.separator && index > 0 && <DropdownMenuSeparator />}

            {/* Menu Item */}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              className={cn(
                action.variant === 'destructive' && 'text-red-600 focus:text-red-600'
              )}
            >
              {action.icon && (
                <span className="mr-2 h-4 w-4 flex items-center justify-center">
                  {action.icon}
                </span>
              )}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

QuickActionMenu.displayName = 'QuickActionMenu';

// ==================== PRESET ACTION GROUPS ====================

/**
 * Common action presets for different entity types
 */
export const QuickActionPresets = {
  /**
   * Standard CRUD actions
   */
  standard: (handlers: {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
  }): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (handlers.onView) {
      actions.push({
        id: 'view',
        label: 'View Details',
        onClick: handlers.onView,
      });
    }

    if (handlers.onEdit) {
      actions.push({
        id: 'edit',
        label: 'Edit',
        onClick: handlers.onEdit,
      });
    }

    if (handlers.onDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        onClick: handlers.onDelete,
        variant: 'destructive',
        separator: true,
      });
    }

    return actions;
  },

  /**
   * Property-specific actions
   */
  property: (handlers: {
    onView?: () => void;
    onEdit?: () => void;
    onShare?: () => void;
    onSubmitOffer?: () => void;
    onDuplicate?: () => void;
    onArchive?: () => void;
    onDelete?: () => void;
  }): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (handlers.onView) actions.push({ id: 'view', label: 'View Details', onClick: handlers.onView });
    if (handlers.onEdit) actions.push({ id: 'edit', label: 'Edit', onClick: handlers.onEdit });
    if (handlers.onShare) actions.push({ id: 'share', label: 'Share', onClick: handlers.onShare });
    if (handlers.onSubmitOffer) actions.push({ id: 'submit-offer', label: 'Submit Offer', onClick: handlers.onSubmitOffer });
    if (handlers.onDuplicate) actions.push({ id: 'duplicate', label: 'Duplicate', onClick: handlers.onDuplicate });

    if (handlers.onArchive) {
      actions.push({
        id: 'archive',
        label: 'Archive',
        onClick: handlers.onArchive,
        separator: true,
      });
    }

    if (handlers.onDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        onClick: handlers.onDelete,
        variant: 'destructive',
        separator: !handlers.onArchive,
      });
    }

    return actions;
  },

  /**
   * Deal-specific actions
   */
  deal: (handlers: {
    onView?: () => void;
    onEdit?: () => void;
    onAdvanceStage?: () => void;
    onAddNote?: () => void;
    onViewDocuments?: () => void;
    onCancel?: () => void;
  }): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (handlers.onView) actions.push({ id: 'view', label: 'View Details', onClick: handlers.onView });
    if (handlers.onEdit) actions.push({ id: 'edit', label: 'Edit', onClick: handlers.onEdit });
    if (handlers.onAdvanceStage) actions.push({ id: 'advance', label: 'Advance Stage', onClick: handlers.onAdvanceStage });
    if (handlers.onAddNote) actions.push({ id: 'note', label: 'Add Note', onClick: handlers.onAddNote, separator: true });
    if (handlers.onViewDocuments) actions.push({ id: 'docs', label: 'View Documents', onClick: handlers.onViewDocuments });

    if (handlers.onCancel) {
      actions.push({
        id: 'cancel',
        label: 'Cancel Deal',
        onClick: handlers.onCancel,
        variant: 'destructive',
        separator: true,
      });
    }

    return actions;
  },

  /**
   * Cycle-specific actions
   */
  cycle: (handlers: {
    onView?: () => void;
    onEdit?: () => void;
    onViewOffers?: () => void;
    onClose?: () => void;
  }): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (handlers.onView) actions.push({ id: 'view', label: 'View Details', onClick: handlers.onView });
    if (handlers.onEdit) actions.push({ id: 'edit', label: 'Edit', onClick: handlers.onEdit });
    if (handlers.onViewOffers) actions.push({ id: 'offers', label: 'View Offers', onClick: handlers.onViewOffers });

    if (handlers.onClose) {
      actions.push({
        id: 'close',
        label: 'Close Cycle',
        onClick: handlers.onClose,
        separator: true,
      });
    }

    return actions;
  },
};

// ==================== INLINE ACTION BUTTONS ====================

export interface InlineActionsProps {
  actions: QuickAction[];
  maxVisible?: number;
  className?: string;
}

/**
 * InlineActions - Show actions as buttons instead of menu
 * Useful for table rows with space
 */
export const InlineActions = React.memo<InlineActionsProps>(({
  actions,
  maxVisible = 3,
  className,
}) => {
  const visibleActions = actions.slice(0, maxVisible);
  const hiddenActions = actions.slice(maxVisible);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Visible as buttons */}
      {visibleActions.map((action) => (
        <Button
          key={action.id}
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          disabled={action.disabled}
          className={cn(
            'h-8 px-2',
            action.variant === 'destructive' && 'text-red-600 hover:text-red-700'
          )}
        >
          {action.icon && <span className="mr-1">{action.icon}</span>}
          {action.label}
        </Button>
      ))}

      {/* Hidden in menu */}
      {hiddenActions.length > 0 && (
        <QuickActionMenu
          actions={hiddenActions}
          variant="ghost"
          size="sm"
        />
      )}
    </div>
  );
});

InlineActions.displayName = 'InlineActions';
