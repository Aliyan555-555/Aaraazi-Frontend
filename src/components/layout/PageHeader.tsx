import React from 'react';
import { ArrowLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { StatusBadge } from './StatusBadge';
import { MetricCard } from './MetricCard';
import { ConnectedEntitiesBar, ConnectedEntity } from './ConnectedEntitiesBar';
import { logger } from "../../lib/logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface PageHeaderBreadcrumb {
  label: string;
  onClick?: () => void;
}

export interface PageHeaderMetric {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
}

export interface PageHeaderAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
}

export interface PageHeaderProps {
  // Navigation
  onBack: () => void;
  breadcrumbs?: PageHeaderBreadcrumb[];

  // Title section
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    variant?: 'success' | 'warning' | 'destructive' | 'default' | 'info';
  };

  // Metrics (Miller's Law: max 5)
  metrics?: PageHeaderMetric[];

  // Actions (Hick's Law: max 3 primary)
  primaryActions?: PageHeaderAction[];
  secondaryActions?: PageHeaderAction[];

  // Connected entities
  connectedEntities?: ConnectedEntity[];

  className?: string;
}

/**
 * PageHeader - Unified header for detail pages
 * Implements UX Laws: Fitts's Law (large targets), Miller's Law (max 5 metrics),
 * Hick's Law (max 3 primary actions), Jakob's Law (familiar patterns)
 * 
 * Usage:
 * <PageHeader
 *   onBack={() => navigate('dashboard')}
 *   breadcrumbs={[
 *     { label: 'Dashboard', onClick: () => nav('dashboard') },
 *     { label: 'Properties', onClick: () => nav('properties') },
 *     { label: 'Marina Residences' }
 *   ]}
 *   icon={<Home />}
 *   title="Marina Residences"
 *   subtitle="DHA Phase 8, Karachi"
 *   status={{ label: 'Available', variant: 'success' }}
 *   metrics={[
 *     { label: 'Price', value: 'PKR 55M', icon: <DollarSign /> },
 *     { label: 'Area', value: '2,500 sqft', icon: <Square /> }
 *   ]}
 *   primaryActions={[
 *     { label: 'Edit', icon: <Edit />, onClick: onEdit },
 *     { label: 'Start Sale', icon: <TrendingUp />, onClick: onStartSale }
 *   ]}
 *   connectedEntities={[...]}
 * />
 */
export function PageHeader({
  onBack,
  breadcrumbs,
  icon,
  title,
  subtitle,
  status,
  metrics,
  primaryActions,
  secondaryActions,
  connectedEntities,
  className = ''
}: PageHeaderProps) {
  const hasPrimaryActions = primaryActions && primaryActions.length > 0;
  const hasSecondaryActions = secondaryActions && secondaryActions.length > 0;

  return (
    <div className={`bg-white border-b border-border-light ${className}`}>
      {/* Top Row: Back + Breadcrumbs + Actions */}
      <div className="px-8 py-5 flex items-center justify-between">
        {/* Left: Back + Breadcrumbs */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Back Button - Fitts's Law: Large target */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* Breadcrumbs - Jakob's Law: Familiar pattern */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 min-w-0" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`Navigate to ${crumb.label}`}
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-foreground font-medium truncate" aria-current="page">
                        {crumb.label}
                      </span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>

        {/* Right: Actions - Fitts's Law: Top-right placement */}
        {(hasPrimaryActions || hasSecondaryActions) && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Primary Actions (max 3) */}
            {primaryActions?.slice(0, 3).map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                onClick={(e) => {
                  logger.log('PageHeader Button Clicked:', {
                    label: action.label,
                    hasOnClick: !!action.onClick,
                    onClickType: typeof action.onClick,
                    variant: action.variant
                  });
                  e.preventDefault();
                  e.stopPropagation();
                  if (action.onClick) {
                    try {
                      action.onClick();
                      logger.log('✅ onClick executed successfully for:', action.label);
                    } catch (error) {
                      logger.error('❌ Error executing onClick for:', action.label, error);
                    }
                  } else {
                    logger.error('❌ No onClick handler for:', action.label);
                  }
                }}
                className="min-w-[100px]"
              >
                {action.icon && (
                  <span className="mr-2">{action.icon}</span>
                )}
                {action.label}
              </Button>
            ))}

            {/* Secondary Actions (dropdown) - Hick's Law: Progressive disclosure */}
            {hasSecondaryActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="w-4 h-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {secondaryActions?.map((action, index) => (
                    <DropdownMenuItem key={index} onClick={action.onClick}>
                      {action.icon && (
                        <span className="mr-2">{action.icon}</span>
                      )}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Title Section */}
      <div className="px-8 py-4 border-t border-border-light">
        <div className="flex items-start gap-4">
          {/* Icon */}
          {icon && (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-foreground flex-shrink-0">
              {React.cloneElement(icon as React.ReactElement<any>, {
                className: 'w-6 h-6',
                'aria-hidden': 'true'
              })}
            </div>
          )}

          {/* Title + Subtitle + Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground truncate">
                {title}
              </h1>
              {status && (
                <StatusBadge
                  status={status.label}
                  variant={status.variant}
                />
              )}
            </div>
            {subtitle && (
              <p className="text-muted-foreground mt-1.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row - Miller's Law: Max 5 metrics */}
      {metrics && metrics.length > 0 && (
        <div className="px-8 py-5 border-t border-border-light">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {metrics.slice(0, 5).map((metric, index) => (
              <MetricCard
                key={index}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                trend={metric.trend}
                variant="compact"
              />
            ))}
          </div>
        </div>
      )}

      {/* Connected Entities Bar - Space-efficient */}
      {connectedEntities && connectedEntities.length > 0 && (
        <ConnectedEntitiesBar entities={connectedEntities} maxVisible={5} />
      )}
    </div>
  );
}