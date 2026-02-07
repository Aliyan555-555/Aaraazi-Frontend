/**
 * WorkspaceKanbanView Component
 * PHASE 5.2: Enhanced View Components ✅
 * 
 * PURPOSE:
 * Professional Kanban board for stage-based workflows (deals, projects).
 * Provides visual pipeline management with columns and cards.
 * 
 * FEATURES:
 * - Horizontal scrolling columns
 * - Column counts and colors
 * - Card selection
 * - Loading skeleton
 * - Collapsible columns
 * - Mobile-responsive (vertical stack)
 * - Smooth animations
 * - Future: Drag & drop ready
 * - WCAG 2.1 AA compliant
 * 
 * UX LAWS:
 * - Miller's Law: Max 7 columns recommended
 * - Fitts's Law: Large cards, easy to click
 * - Aesthetic-Usability: Beautiful columns, smooth scrolling
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { KanbanColumn } from '../WorkspacePageTemplate';

export interface WorkspaceKanbanViewProps<T> {
  /** Items to display */
  items: T[];
  /** Kanban column definitions (max 7 recommended) */
  columns: KanbanColumn[];
  /** Function to get column ID for an item */
  getColumn: (item: T) => string;
  /** Function to extract unique ID from item */
  getItemId: (item: T) => string;
  /** Selected item IDs */
  selectedIds: Set<string>;
  /** Callback when item selection changes */
  onSelectItem: (itemId: string, selected: boolean) => void;
  /** Callback when card is clicked */
  onCardClick?: (item: T) => void;
  /** Custom card renderer */
  renderCard: (item: T, index: number) => React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Column width (fixed) */
  columnWidth?: number;
  /** Allow columns to collapse */
  collapsible?: boolean;
  /** Card density */
  density?: 'compact' | 'comfortable' | 'spacious';
}

/**
 * WorkspaceKanbanView - Enhanced Kanban board
 */
export const WorkspaceKanbanView = <T,>({
  items,
  columns,
  getColumn,
  getItemId,
  selectedIds,
  onSelectItem,
  onCardClick,
  renderCard,
  isLoading = false,
  columnWidth = 320,
  collapsible = true,
  density = 'comfortable',
}: WorkspaceKanbanViewProps<T>) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  // Group items by column
  const groupedItems = new Map<string, T[]>();
  columns.forEach(col => groupedItems.set(col.id, []));
  items.forEach(item => {
    const columnId = getColumn(item);
    if (groupedItems.has(columnId)) {
      groupedItems.get(columnId)!.push(item);
    }
  });

  // Toggle column collapse
  const toggleColumn = (columnId: string) => {
    const newCollapsed = new Set(collapsedColumns);
    if (newCollapsed.has(columnId)) {
      newCollapsed.delete(columnId);
    } else {
      newCollapsed.add(columnId);
    }
    setCollapsedColumns(newCollapsed);
  };

  // Card gap based on density
  const cardGap = {
    compact: 'space-y-2',
    comfortable: 'space-y-3',
    spacious: 'space-y-4',
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <KanbanLoadingSkeleton
        columns={columns}
        columnWidth={columnWidth}
      />
    );
  }

  return (
    <div className="pb-4">
      {/* Desktop: Horizontal scroll */}
      <div className="hidden md:flex gap-4 overflow-x-auto">
        {columns.map((column) => {
          const columnItems = groupedItems.get(column.id) || [];
          const isCollapsed = collapsedColumns.has(column.id);

          return (
            <KanbanColumn
              key={column.id}
              column={column}
              items={columnItems}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => toggleColumn(column.id)}
              collapsible={collapsible}
              width={columnWidth}
              cardGap={cardGap[density]}
              selectedIds={selectedIds}
              onSelectItem={onSelectItem}
              getItemId={getItemId}
              onCardClick={onCardClick}
              renderCard={renderCard}
            />
          );
        })}
      </div>

      {/* Mobile: Vertical stack */}
      <div className="md:hidden space-y-4">
        {columns.map((column) => {
          const columnItems = groupedItems.get(column.id) || [];
          const isCollapsed = collapsedColumns.has(column.id);

          return (
            <KanbanColumn
              key={column.id}
              column={column}
              items={columnItems}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => toggleColumn(column.id)}
              collapsible={collapsible}
              width="100%"
              cardGap={cardGap[density]}
              selectedIds={selectedIds}
              onSelectItem={onSelectItem}
              getItemId={getItemId}
              onCardClick={onCardClick}
              renderCard={renderCard}
            />
          );
        })}
      </div>
    </div>
  );
};

// ==================== KANBAN COLUMN ====================

interface KanbanColumnProps<T> {
  column: KanbanColumn;
  items: T[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  collapsible: boolean;
  width: number | string;
  cardGap: string;
  selectedIds: Set<string>;
  onSelectItem: (itemId: string, selected: boolean) => void;
  getItemId: (item: T) => string;
  onCardClick?: (item: T) => void;
  renderCard: (item: T, index: number) => React.ReactNode;
}

const KanbanColumn = <T,>({
  column,
  items,
  isCollapsed,
  onToggleCollapse,
  collapsible,
  width,
  cardGap,
  selectedIds,
  onSelectItem,
  getItemId,
  onCardClick,
  renderCard,
}: KanbanColumnProps<T>) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <div
      className="flex-shrink-0 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
      style={{ width: isCollapsed ? '60px' : widthStyle }}
    >
      {/* Column Header */}
      <div
        className={cn(
          'p-4 border-b bg-white',
          collapsible && 'cursor-pointer hover:bg-gray-50 transition-colors'
        )}
        onClick={collapsible ? onToggleCollapse : undefined}
      >
        {isCollapsed ? (
          // Collapsed: Vertical text
          <div className="flex flex-col items-center">
            <div className="writing-mode-vertical text-sm font-medium whitespace-nowrap">
              {column.label}
            </div>
            <div className="mt-2 text-xs text-gray-600">{items.length}</div>
            {collapsible && <ChevronDown className="h-4 w-4 mt-2 text-gray-400" />}
          </div>
        ) : (
          // Expanded: Horizontal layout
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {column.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
              )}
              <h3 className="font-medium text-gray-900">{column.label}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{items.length}</span>
              {collapsible && (
                <button
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Collapse column"
                >
                  <Minus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column Items */}
      {!isCollapsed && (
        <div className={cn('p-3 max-h-[calc(100vh-300px)] overflow-y-auto', cardGap)}>
          {items.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No items
            </div>
          ) : (
            items.map((item, index) => {
              const itemId = getItemId(item);
              const isSelected = selectedIds.has(itemId);

              return (
                <KanbanCard
                  key={itemId}
                  isSelected={isSelected}
                  onSelect={(selected) => onSelectItem(itemId, selected)}
                  onClick={() => onCardClick?.(item)}
                >
                  {renderCard(item, index)}
                </KanbanCard>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ==================== KANBAN CARD ====================

interface KanbanCardProps {
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick?: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  children,
  isSelected,
  onSelect,
  onClick,
}) => {
  return (
    <div className="relative group">
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer h-4 w-4"
          aria-label="Select item"
        />
      </div>

      {/* Card Content */}
      <div
        className={cn(
          'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer',
          isSelected && 'ring-2 ring-blue-500 border-blue-500'
        )}
        onClick={onClick}
      >
        {children}
      </div>
    </div>
  );
};

// ==================== LOADING SKELETON ====================

interface KanbanLoadingSkeletonProps {
  columns: KanbanColumn[];
  columnWidth?: number;
  cardsPerColumn?: number;
}

const KanbanLoadingSkeleton: React.FC<KanbanLoadingSkeletonProps> = ({
  columns,
  columnWidth = 320,
  cardsPerColumn = 3,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column, colIndex) => (
        <div
          key={column.id}
          className="flex-shrink-0 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
          style={{ width: `${columnWidth}px` }}
        >
          {/* Header Skeleton */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-24" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-8" />
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="p-3 space-y-3">
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div
                  className="h-4 bg-gray-200 rounded animate-pulse mb-2"
                  style={{ animationDelay: `${(colIndex * cardsPerColumn + cardIndex) * 0.1}s` }}
                />
                <div
                  className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-3"
                  style={{ animationDelay: `${(colIndex * cardsPerColumn + cardIndex) * 0.1 + 0.1}s` }}
                />
                <div
                  className="h-3 bg-gray-200 rounded animate-pulse w-1/2"
                  style={{ animationDelay: `${(colIndex * cardsPerColumn + cardIndex) * 0.1 + 0.2}s` }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== CSS for vertical text (add to globals.css) ====================
// .writing-mode-vertical {
//   writing-mode: vertical-rl;
//   text-orientation: mixed;
// }
