import React, { useMemo } from 'react';
import { User, SellCycle, Property } from '../../../types';
import { ActionItem } from '../components/ActionItem';
import { detectAllActions, getActionSummary, DashboardAction } from '../utils/detectActions';
import { Task } from '../../../types/tasks';
import { DashboardLead } from '../../../types/leads';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ActionCenterSectionProps {
  user: User;
  tasks: Task[];
  leads: DashboardLead[];
  properties: Property[];
  sellCycles: SellCycle[];
  onNavigate: (route: string, id?: string) => void;
  loading?: boolean;
}

/**
 * Empty state when no actions
 */
const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-foreground mb-2">All Caught Up! 🎉</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        No urgent actions right now. Your pipeline is running smoothly.
      </p>
    </div>
  );
};

/**
 * Loading state
 */
const LoadingState: React.FC = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-gray-100 rounded-lg h-24 animate-pulse"
        />
      ))}
    </div>
  );
};

/**
 * ActionCenterSection Component
 */
export const ActionCenterSection: React.FC<ActionCenterSectionProps> = ({
  user,
  tasks,
  leads,
  properties,
  sellCycles,
  onNavigate,
  loading = false,
}) => {
  // Detect all actions
  const allActions = useMemo(() => {
    if (loading) return [];
    return detectAllActions(tasks, leads, properties, sellCycles);
  }, [tasks, leads, properties, sellCycles, loading]);

  // Get summary
  const summary = useMemo(() => {
    return getActionSummary(allActions);
  }, [allActions]);

  // Show top 6 actions (Miller's Law: 7±2)
  const topActions = useMemo(() => {
    return allActions.slice(0, 6);
  }, [allActions]);

  const hasMore = allActions.length > 6;

  // Handle action click
  const handleActionClick = (action: DashboardAction) => {
    // Navigate based on action route
    const parts = action.actionRoute.split('/');
    onNavigate(parts[0], parts[1]);
  };

  // Handle quick action
  const handleQuickAction = (action: DashboardAction) => {
    // For now, just navigate - can add quick complete/snooze later
    handleActionClick(action);
  };

  // Handle view all
  const handleViewAll = () => {
    // TODO: Navigate to full actions/tasks page
    onNavigate('tasks');
  };

  return (
    <section aria-labelledby="action-center-title" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Sparkles className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 id="action-center-title" className="text-foreground">
              Action Center
            </h2>
            <p className="text-muted-foreground">
              {summary.total === 0
                ? 'Nothing needs attention'
                : `${summary.total} ${summary.total === 1 ? 'item' : 'items'} need attention`
              }
              {summary.critical > 0 && ` · ${summary.critical} critical`}
            </p>
          </div>
        </div>

        {/* Priority Summary */}
        {summary.total > 0 && (
          <div className="flex items-center gap-2">
            {summary.critical > 0 && (
              <span className="bg-destructive-bg text-destructive-foreground px-2 py-1 rounded">
                {summary.critical} Critical
              </span>
            )}
            {summary.high > 0 && (
              <span className="bg-warning-bg text-warning-foreground px-2 py-1 rounded">
                {summary.high} High
              </span>
            )}
            {hasMore && (
              <button
                onClick={handleViewAll}
                className="text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                aria-label="View all actions"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-border p-6">
        {loading ? (
          <LoadingState />
        ) : topActions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {topActions.map(action => (
              <ActionItem
                key={action.id}
                action={action}
                onClick={() => handleActionClick(action)}
                onQuickAction={() => handleQuickAction(action)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Type Breakdown (if actions exist) */}
      {!loading && summary.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {summary.byType.newLeads > 0 && (
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <div className="text-primary mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
                {summary.byType.newLeads}
              </div>
              <div className="text-muted-foreground">New Leads</div>
            </div>
          )}
          {summary.byType.overdueTasks > 0 && (
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <div className="text-destructive mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
                {summary.byType.overdueTasks}
              </div>
              <div className="text-muted-foreground">Overdue Tasks</div>
            </div>
          )}
          {summary.byType.staleLeads > 0 && (
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <div className="text-warning mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
                {summary.byType.staleLeads}
              </div>
              <div className="text-muted-foreground">Stale Leads</div>
            </div>
          )}
          {summary.byType.expiringOffers > 0 && (
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <div className="text-warning mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
                {summary.byType.expiringOffers}
              </div>
              <div className="text-muted-foreground">Expiring Offers</div>
            </div>
          )}
          {summary.byType.upcomingAppointments > 0 && (
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <div className="text-info mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
                {summary.byType.upcomingAppointments}
              </div>
              <div className="text-muted-foreground">Appointments</div>
            </div>
          )}
          {summary.byType.inactiveProperties > 0 && (
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <div className="text-muted-foreground mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
                {summary.byType.inactiveProperties}
              </div>
              <div className="text-muted-foreground">Inactive Props</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
