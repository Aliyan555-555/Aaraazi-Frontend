/**
 * DashboardTemplate - Template for dashboard pages in aaraazi
 * 
 * PURPOSE:
 * Provides standardized layout for widget-based dashboards with real-time data,
 * metrics, charts, and tabbed content. Designed specifically for overview and
 * analytics pages that show multiple entity types and aggregated data.
 * 
 * WHY NEW TEMPLATE?
 * - Dashboards need real-time data updates (not standard in detail pages)
 * - Widget/metric grid layout (different from tab-based detail pages)
 * - Multi-entity overview (not single-entity focus)
 * - Different information hierarchy (metrics-first, not entity-first)
 * - Will be used for: Main Dashboard, Sales Dashboard, Analytics Dashboard, Agency Hub
 * 
 * WHEN TO USE:
 * - Page shows overview of multiple entity types
 * - KPI metrics and charts are primary content
 * - Real-time or periodic data updates needed
 * - Tab-based navigation with different views
 * - No single entity focus (use DetailPageTemplate for that)
 * 
 * WHEN NOT TO USE:
 * - Single entity focus (use DetailPageTemplate)
 * - CRUD operations on list (use WorkspaceTemplate)
 * - Report generation (consider ReportTemplate)
 * - Form submission (use FormTemplate)
 * 
 * FOLLOWS DESIGN SYSTEM V4.1:
 * - UX Laws: Max 5 metrics (Miller), 44px buttons (Fitts), 3 primary actions (Hick)
 * - Design Tokens: 8px grid, CSS variables for colors
 * - Accessibility: WCAG 2.1 AA, keyboard nav, ARIA labels
 * 
 * @example
 * <DashboardTemplate
 *   title="Sales Dashboard"
 *   description="Overview of sales performance and metrics"
 *   metrics={[
 *     { label: 'Revenue', value: 'PKR 5,000,000', icon: <DollarSign />, trend: 12 },
 *     { label: 'Properties Sold', value: '45', icon: <Home />, trend: 8 },
 *   ]}
 *   filters={<TimeRangeFilter value={range} onChange={setRange} />}
 *   primaryAction={{ label: 'Export Report', onClick: handleExport }}
 *   tabs={[
 *     { id: 'overview', label: 'Overview', content: <OverviewContent /> },
 *     { id: 'agents', label: 'Agents', content: <AgentsContent /> },
 *   ]}
 * />
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MetricCard } from '../ui/metric-card';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface DashboardMetric {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number; // Percentage change (positive or negative)
  variant?: 'default' | 'success' | 'warning' | 'danger';
  description?: string;
}

export interface DashboardAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
}

export interface DashboardTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: string | number; // Optional badge count
}

export interface DashboardTemplateProps {
  // Header Configuration
  title: string;
  description?: string;
  onBack?: () => void;
  
  // Metrics Section (max 5-7 per Miller's Law)
  metrics?: DashboardMetric[];
  
  // Actions (max 3 primary per Hick's Law)
  primaryAction?: DashboardAction;
  secondaryActions?: DashboardAction[];
  
  // Filters Section
  filters?: React.ReactNode;
  showFilters?: boolean;
  
  // Content Organization
  tabs?: DashboardTab[];
  defaultTab?: string;
  
  // Single-view content (if not using tabs)
  content?: React.ReactNode;
  
  // Refresh/Real-time
  refreshInterval?: number; // milliseconds
  onRefresh?: () => void;
  lastUpdated?: Date;
  
  // Layout Options
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  title,
  description,
  onBack,
  metrics = [],
  primaryAction,
  secondaryActions = [],
  filters,
  showFilters = false,
  tabs = [],
  defaultTab,
  content,
  refreshInterval,
  onRefresh,
  lastUpdated,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  const [showFilterPanel, setShowFilterPanel] = useState(showFilters);

  // Auto-refresh logic
  React.useEffect(() => {
    if (refreshInterval && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, onRefresh]);

  // ============================================================================
  // Render Header
  // ============================================================================

  const renderHeader = () => (
    <div className={`bg-white border-b border-muted ${headerClassName}`}>
      <div className="p-6">
        {/* Back Button & Title Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                aria-label="Go back"
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            
            <div>
              <h1 className="text-primary">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Primary Action - Large button (Fitts's Law) */}
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                variant={primaryAction.variant || 'default'}
                disabled={primaryAction.disabled}
                className="h-11 min-w-[120px]"
                aria-label={primaryAction.label}
              >
                {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
                {primaryAction.label}
              </Button>
            )}

            {/* Secondary Actions - Dropdown (Hick's Law) */}
            {secondaryActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {secondaryActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={action.onClick}
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

        {/* Filters Section */}
        {filters && (
          <div className="mt-4">
            {filters}
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Metrics Section - Below header, above content */}
      {metrics.length > 0 && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {metrics.slice(0, 5).map((metric, index) => (
              <MetricCard
                key={index}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                trend={metric.trend}
                variant={metric.variant}
                description={metric.description}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // Render Content
  // ============================================================================

  const renderContent = () => {
    // Tabs Mode
    if (tabs.length > 0) {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b border-muted bg-white px-6">
            <TabsList className="w-full justify-start bg-transparent h-12">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-white">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className={`flex-1 ${contentClassName}`}>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0 h-full">
                {tab.content}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      );
    }

    // Single Content Mode
    if (content) {
      return <div className={`flex-1 ${contentClassName}`}>{content}</div>;
    }

    return null;
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${className}`}>
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

// ============================================================================
// Utility Components
// ============================================================================

/**
 * DashboardCard - Reusable card component for dashboard widgets
 */
export const DashboardCard: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, action, children, className = '' }) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      {action}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

/**
 * DashboardGrid - Standard grid layout for dashboard widgets
 */
export const DashboardGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}> = ({ children, columns = 2, className = '' }) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * DashboardEmptyState - Empty state for dashboard sections
 */
export const DashboardEmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
    <h3 className="text-primary mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
    {action}
  </div>
);

// ============================================================================
// Export
// ============================================================================

export default DashboardTemplate;
