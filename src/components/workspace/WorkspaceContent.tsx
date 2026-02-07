/**
 * WorkspaceContent Component
 * PHASE 5.1: Core Template System ✅
 * 
 * PURPOSE:
 * Main content area that renders different view modes (Table, Grid, Kanban).
 * Handles view switching and delegates to specific view components.
 * 
 * FEATURES:
 * - Smooth view transitions
 * - Loading states
 * - Empty states
 * - Delegates to view-specific components
 */

import React from 'react';
import { Column, KanbanColumn } from './WorkspacePageTemplate';

export interface WorkspaceContentProps<T> {
  /** Current view mode */
  viewMode: 'table' | 'grid' | 'kanban';
  /** Items to display */
  items: T[];
  /** Loading state */
  isLoading?: boolean;
  /** Selected item IDs */
  selectedIds: Set<string>;
  /** Callback when item is selected */
  onSelectItem: (itemId: string, selected: boolean) => void;
  /** Callback when select all is toggled */
  onSelectAll: (selected: boolean) => void;
  /** Function to get item ID */
  getItemId: (item: T) => string;
  /** Callback when item is clicked */
  onItemClick?: (item: T) => void;

  // Table props
  columns?: Column<T>[];
  renderTableRow?: (item: T, index: number) => React.ReactNode;

  // Grid props
  renderCard?: (item: T, index: number) => React.ReactNode;

  // Kanban props
  kanbanColumns?: KanbanColumn[];
  getKanbanColumn?: (item: T) => string;
  renderKanbanCard?: (item: T, index: number) => React.ReactNode;
}

/**
 * WorkspaceContent - Main content area with view switching
 */
export const WorkspaceContent = React.memo(<T,>({
  viewMode,
  items,
  isLoading = false,
  selectedIds,
  onSelectItem,
  onSelectAll,
  getItemId,
  onItemClick,
  columns = [],
  renderTableRow,
  renderCard,
  kanbanColumns = [],
  getKanbanColumn,
  renderKanbanCard,
}: WorkspaceContentProps<T>) => {
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render based on view mode
  switch (viewMode) {
    case 'table':
      return (
        <TableView
          items={items}
          columns={columns}
          selectedIds={selectedIds}
          onSelectItem={onSelectItem}
          onSelectAll={onSelectAll}
          getItemId={getItemId}
          onItemClick={onItemClick}
          renderTableRow={renderTableRow}
        />
      );

    case 'grid':
      return (
        <GridView
          items={items}
          selectedIds={selectedIds}
          onSelectItem={onSelectItem}
          getItemId={getItemId}
          onItemClick={onItemClick}
          renderCard={renderCard}
        />
      );

    case 'kanban':
      return (
        <KanbanView
          items={items}
          columns={kanbanColumns}
          getColumn={getKanbanColumn}
          selectedIds={selectedIds}
          onSelectItem={onSelectItem}
          getItemId={getItemId}
          onItemClick={onItemClick}
          renderCard={renderKanbanCard}
        />
      );

    default:
      return null;
  }
}) as <T>(props: WorkspaceContentProps<T>) => React.ReactElement;

WorkspaceContent.displayName = 'WorkspaceContent';

// ==================== TABLE VIEW ====================

interface TableViewProps<T> {
  items: T[];
  columns: Column<T>[];
  selectedIds: Set<string>;
  onSelectItem: (itemId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  getItemId: (item: T) => string;
  onItemClick?: (item: T) => void;
  renderTableRow?: (item: T, index: number) => React.ReactNode;
}

const TableView = <T,>({
  items,
  columns,
  selectedIds,
  onSelectItem,
  onSelectAll,
  getItemId,
  onItemClick,
  renderTableRow,
}: TableViewProps<T>) => {
  const allSelected = items.length > 0 && items.every(item => selectedIds.has(getItemId(item)));
  const someSelected = items.some(item => selectedIds.has(getItemId(item))) && !allSelected;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {/* Selection column */}
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Select all items"
                />
              </th>

              {/* Column headers */}
              {columns.filter(col => col.visible !== false).map((column) => (
                <th
                  key={column.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {items.map((item, index) => {
              const itemId = getItemId(item);
              const isSelected = selectedIds.has(itemId);

              if (renderTableRow) {
                return (
                  <tr key={itemId} className="hover:bg-gray-50">
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectItem(itemId, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select item ${itemId}`}
                      />
                    </td>
                    {renderTableRow(item, index)}
                  </tr>
                );
              }

              return (
                <tr
                  key={itemId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onItemClick?.(item)}
                >
                  <td className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectItem(itemId, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Select item ${itemId}`}
                    />
                  </td>
                  {columns.filter(col => col.visible !== false).map((column) => (
                    <td
                      key={column.id}
                      className="px-6 py-4"
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {column.accessor(item)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== GRID VIEW ====================

interface GridViewProps<T> {
  items: T[];
  selectedIds: Set<string>;
  onSelectItem: (itemId: string, selected: boolean) => void;
  getItemId: (item: T) => string;
  onItemClick?: (item: T) => void;
  renderCard?: (item: T, index: number) => React.ReactNode;
}

const GridView = <T,>({
  items,
  selectedIds,
  onSelectItem,
  getItemId,
  onItemClick,
  renderCard,
}: GridViewProps<T>) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item, index) => {
        const itemId = getItemId(item);
        const isSelected = selectedIds.has(itemId);

        if (renderCard) {
          return (
            <div key={itemId} className="relative">
              {/* Selection checkbox (top-left corner) */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectItem(itemId, e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={`Select item ${itemId}`}
                />
              </div>
              {renderCard(item, index)}
            </div>
          );
        }

        // Default card (if no custom renderer)
        return (
          <div
            key={itemId}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
            <div className="absolute top-3 left-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelectItem(itemId, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select item ${itemId}`}
              />
            </div>
            <pre className="text-xs overflow-auto">{JSON.stringify(item, null, 2)}</pre>
          </div>
        );
      })}
    </div>
  );
};

// ==================== KANBAN VIEW ====================

interface KanbanViewProps<T> {
  items: T[];
  columns: KanbanColumn[];
  getColumn?: (item: T) => string;
  selectedIds: Set<string>;
  onSelectItem: (itemId: string, selected: boolean) => void;
  getItemId: (item: T) => string;
  onItemClick?: (item: T) => void;
  renderCard?: (item: T, index: number) => React.ReactNode;
}

const KanbanView = <T,>({
  items,
  columns,
  getColumn,
  selectedIds,
  onSelectItem,
  getItemId,
  onItemClick,
  renderCard,
}: KanbanViewProps<T>) => {
  if (!getColumn) {
    return (
      <div className="text-center py-12 text-gray-600">
        Kanban view requires getKanbanColumn function
      </div>
    );
  }

  // Group items by column
  const groupedItems = new Map<string, T[]>();
  columns.forEach(col => groupedItems.set(col.id, []));
  items.forEach(item => {
    const columnId = getColumn(item);
    if (groupedItems.has(columnId)) {
      groupedItems.get(columnId)!.push(item);
    }
  });

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-max px-1">
        {columns.map((column) => {
          const columnItems = groupedItems.get(column.id) || [];

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200"
            >
            {/* Column Header */}
            <div className="p-4 border-b bg-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{column.label}</h3>
                <span className="text-sm text-gray-600">{columnItems.length}</span>
              </div>
            </div>

            {/* Column Items */}
            <div className="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {columnItems.map((item, index) => {
                const itemId = getItemId(item);
                const isSelected = selectedIds.has(itemId);

                if (renderCard) {
                  return (
                    <div key={itemId} className="relative">
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectItem(itemId, e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          aria-label={`Select item ${itemId}`}
                        />
                      </div>
                      {renderCard(item, index)}
                    </div>
                  );
                }

                // Default kanban card
                return (
                  <div
                    key={itemId}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onItemClick?.(item)}
                  >
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectItem(itemId, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select item ${itemId}`}
                      />
                    </div>
                    <pre className="text-xs overflow-auto mt-6">{JSON.stringify(item, null, 2)}</pre>
                  </div>
                );
              })}

              {columnItems.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500">
                  No items
                </div>
              )}
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
};
