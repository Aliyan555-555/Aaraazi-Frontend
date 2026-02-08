/**
 * WorkspaceHeader Component
 * 
 * Unified header for workspace/listing pages (Properties, Cycles, Deals, Requirements)
 * Provides consistent navigation, actions, and view controls.
 * 
 * FEATURES:
 * - Title and description
 * - Breadcrumb navigation
 * - Primary action button (e.g., "Add Property")
 * - Secondary actions dropdown
 * - View switcher (table/grid/kanban)
 * - Filter toggle
 * - Stats display
 * 
 * UX LAWS:
 * - Fitts's Law: Large action buttons, optimal placement
 * - Miller's Law: Max 5 stats, limited primary actions
 * - Hick's Law: Progressive disclosure for secondary actions
 * - Jakob's Law: Familiar patterns (breadcrumbs, view switchers)
 * - Aesthetic-Usability: Consistent spacing, professional appearance
 * 
 * @example
 * <WorkspaceHeader
 *   title="Properties"
 *   description="Manage your property portfolio"
 *   breadcrumbs={[
 *     { label: 'Dashboard', onClick: () => nav('dashboard') },
 *     { label: 'Properties' }
 *   ]}
 *   stats={[
 *     { label: 'Total', value: 150, variant: 'default' },
 *     { label: 'Available', value: 45, variant: 'success' },
 *     { label: 'Sold', value: 105, variant: 'info' }
 *   ]}
 *   primaryAction={{
 *     label: 'Add Property',
 *     icon: <Plus />,
 *     onClick: handleAdd
 *   }}
 *   secondaryActions={[
 *     { label: 'Import', icon: <Upload />, onClick: handleImport },
 *     { label: 'Export', icon: <Download />, onClick: handleExport }
 *   ]}
 *   viewMode="table"
 *   onViewModeChange={setViewMode}
 *   showFilters={true}
 *   onToggleFilters={toggleFilters}
 * />
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ChevronRight, MoreHorizontal, Table, Grid, Kanban, Filter, LucideIcon } from 'lucide-react';

// Types
interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface Stat {
  label: string;
  value: number | string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  icon?: React.ReactNode;
}

interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
}

export interface WorkspaceHeaderProps {
  // Content
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];

  // Stats (Miller's Law: max 5)
  stats?: Stat[];

  // Actions (Hick's Law: max 3 primary)
  primaryAction?: Action;
  secondaryActions?: Action[];

  // View controls
  viewMode?: 'table' | 'grid' | 'kanban';
  onViewModeChange?: (mode: 'table' | 'grid' | 'kanban') => void;
  availableViews?: Array<'table' | 'grid' | 'kanban'>;

  // Filters
  showFilters?: boolean;
  onToggleFilters?: () => void;
  filterCount?: number;

  // Navigation
  onBack?: () => void;

  // Styling
  className?: string;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  stats,
  primaryAction,
  secondaryActions,
  viewMode = 'table',
  onViewModeChange,
  availableViews = ['table', 'grid'],
  showFilters,
  onToggleFilters,
  filterCount = 0,
  className = '',
}) => {
  // Status variant helper
  const getStatVariantClass = (variant: Stat['variant'] = 'default'): string => {
    const variants = {
      default: 'bg-neutral-100 text-slate-700',
      success: 'bg-success-bg text-success',
      warning: 'bg-warning-bg text-warning-foreground',
      destructive: 'bg-destructive-bg text-destructive',
      info: 'bg-info-bg text-info-foreground',
    };
    return variants[variant];
  };

  // View mode icons
  const viewIcons = {
    table: Table,
    grid: Grid,
    kanban: Kanban,
  };

  return (
    <div className={`bg-white border-b border-border-light ${className}`}>
      <div className="px-8 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mb-4" style={{ fontSize: 'var(--text-sm)' }}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Navigate to ${crumb.label}`}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Title and Actions Row */}
        <div className="flex items-start justify-between mb-6">
          {/* Title Section */}
          <div>
            <h1 className="mb-2" style={{ fontSize: 'var(--text-2xl)' }}>{title}</h1>
            {description && (
              <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)' }}>{description}</p>
            )}
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            {onToggleFilters && (
              <Button
                variant="outline"
                size="default"
                onClick={onToggleFilters}
                className="gap-2"
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              >
                <Filter className="w-4 h-4" />
                Filters
                {filterCount > 0 && (
                  <Badge variant="default" className="ml-1 px-2 py-0.5" style={{ fontSize: 'var(--text-xs)' }}>
                    {filterCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* View Mode Switcher */}
            {onViewModeChange && availableViews.length > 1 && (
              <div className="flex items-center border border-border rounded-lg" role="group" aria-label="View mode">
                {availableViews.map((mode) => {
                  const Icon = viewIcons[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => onViewModeChange(mode)}
                      className={`px-3 py-2 transition-colors ${viewMode === mode
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-neutral-50'
                        } ${mode !== availableViews[0] ? 'border-l border-border' : ''}`}
                      aria-label={`${mode} view`}
                      aria-pressed={viewMode === mode}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Secondary Actions Dropdown */}
            {secondaryActions && secondaryActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {secondaryActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className="gap-2"
                    >
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Primary Action */}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || 'default'}
                size="default"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="gap-2"
              >
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-6 pt-5 border-t border-border-light">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                {stat.icon && (
                  <div className="text-muted-foreground">
                    {stat.icon}
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1" style={{ fontSize: 'var(--text-xs)' }}>{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${getStatVariantClass(stat.variant)} border-0 px-2.5 py-1`}
                    >
                      {stat.value}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Display name for debugging
WorkspaceHeader.displayName = 'WorkspaceHeader';