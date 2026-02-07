/**
 * ViewModeSwitcher Component
 * PHASE 5.1: Core Template System ✅
 * 
 * PURPOSE:
 * Toggle between Table, Grid, and Kanban view modes.
 * Provides familiar interface pattern for view switching.
 * 
 * UX LAWS:
 * - Jakob's Law: Familiar toggle pattern (like Google Drive, Linear)
 * - Fitts's Law: Large touch targets (40x40px buttons)
 * - Aesthetic-Usability: Smooth transitions, clear active state
 */

import React from 'react';
import { Button } from '../ui/button';
import { LayoutGrid, LayoutList, Columns3 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ViewModeSwitcherProps {
  /** Current view mode */
  viewMode: 'table' | 'grid' | 'kanban';
  /** Callback when view mode changes */
  onViewModeChange: (mode: 'table' | 'grid' | 'kanban') => void;
  /** Available view modes */
  availableViews?: Array<'table' | 'grid' | 'kanban'>;
}

/**
 * ViewModeSwitcher - Toggle between view modes
 */
export const ViewModeSwitcher = React.memo<ViewModeSwitcherProps>(({
  viewMode,
  onViewModeChange,
  availableViews = ['table', 'grid'],
}) => {
  // View mode configurations
  const viewModes = [
    {
      id: 'table' as const,
      label: 'Table',
      icon: LayoutList,
      available: availableViews.includes('table'),
    },
    {
      id: 'grid' as const,
      label: 'Grid',
      icon: LayoutGrid,
      available: availableViews.includes('grid'),
    },
    {
      id: 'kanban' as const,
      label: 'Kanban',
      icon: Columns3,
      available: availableViews.includes('kanban'),
    },
  ];

  // Filter to only available views
  const availableModes = viewModes.filter(mode => mode.available);

  // Don't render if only one view available
  if (availableModes.length <= 1) {
    return null;
  }

  return (
    <div 
      className="inline-flex items-center rounded-lg border bg-white p-1"
      role="group"
      aria-label="View mode switcher"
    >
      {availableModes.map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;

        return (
          <Button
            key={mode.id}
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange(mode.id)}
            className={cn(
              'h-8 px-3 gap-2 transition-colors',
              isActive && 'bg-gray-100 shadow-sm'
            )}
            aria-label={`${mode.label} view`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{mode.label}</span>
          </Button>
        );
      })}
    </div>
  );
});

ViewModeSwitcher.displayName = 'ViewModeSwitcher';