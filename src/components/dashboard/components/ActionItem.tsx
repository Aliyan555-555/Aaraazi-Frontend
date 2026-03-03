/**
 * ActionItem Component
 * 
 * Displays a single action item with priority indicator and quick action.
 * 
 * FEATURES:
 * - Priority color coding (critical=red, high=orange, medium=yellow, low=blue)
 * - Icon based on action type
 * - Clear title and description
 * - Quick action button
 * - Clickable to navigate
 * 
 * DESIGN:
 * - Follows Design System
 * - NO Tailwind typography classes
 * - Accessible (keyboard nav, ARIA labels)
 * 
 * UX LAWS:
 * - Fitts's Law: Full-width click target
 * - Aesthetic-Usability: Clean, professional
 */

import React from 'react';
import { DashboardAction, ActionPriority } from '../utils/detectActions';
import {
  AlertCircle,
  Clock,
  Home,
  FileText,
  Calendar,
  UserPlus,
  ChevronRight,
} from 'lucide-react';

interface ActionItemProps {
  action: DashboardAction;
  onClick: () => void;
  onQuickAction?: () => void;
}

/**
 * Get icon based on action type
 */
function getActionIcon(type: DashboardAction['type']) {
  switch (type) {
    case 'overdue-task':
      return <AlertCircle className="h-5 w-5" />;
    case 'stale-lead':
      return <Clock className="h-5 w-5" />;
    case 'inactive-property':
      return <Home className="h-5 w-5" />;
    case 'expiring-offer':
      return <FileText className="h-5 w-5" />;
    case 'upcoming-appointment':
      return <Calendar className="h-5 w-5" />;
    case 'new-lead':
      return <UserPlus className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
}

/**
 * Get colors based on priority
 */
function getPriorityColors(priority: ActionPriority) {
  switch (priority) {
    case 'critical':
      return {
        border: 'border-l-destructive',
        bg: 'bg-destructive-bg',
        icon: 'text-destructive-foreground',
        badge: 'bg-destructive-bg text-destructive-foreground',
      };
    case 'high':
      return {
        border: 'border-l-warning',
        bg: 'bg-warning-bg',
        icon: 'text-warning-foreground',
        badge: 'bg-warning-bg text-warning-foreground',
      };
    case 'medium':
      return {
        border: 'border-l-warning',
        bg: 'bg-warning-bg',
        icon: 'text-warning-foreground',
        badge: 'bg-warning-bg text-warning-foreground',
      };
    case 'low':
      return {
        border: 'border-l-info',
        bg: 'bg-info-bg',
        icon: 'text-info-foreground',
        badge: 'bg-info-bg text-info-foreground',
      };
  }
}

/**
 * Format priority label
 */
function formatPriority(priority: ActionPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * ActionItem Component
 */
export const ActionItem: React.FC<ActionItemProps> = ({
  action,
  onClick,
  onQuickAction,
}) => {
  const colors = getPriorityColors(action.priority);
  const icon = getActionIcon(action.type);

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAction) {
      onQuickAction();
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${colors.bg} ${colors.border}
        border-l-4 rounded-lg p-4
        hover:shadow-md transition-shadow cursor-pointer
        group
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${action.title} - ${action.description}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Priority Badge */}
          <div className="flex items-start gap-2 mb-1">
            <h3 className="text-foreground flex-1 truncate">
              {action.title}
            </h3>
            <span className={`${colors.badge} px-2 py-0.5 rounded flex-shrink-0`} style={{ fontSize: 'var(--text-xs)' }}>
              {formatPriority(action.priority)}
            </span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-2" style={{ fontSize: 'var(--text-sm)' }}>
            {action.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-muted-foreground/80" style={{ fontSize: 'var(--text-xs)' }}>
            {action.daysOverdue !== undefined && (
              <span>
                {action.daysOverdue} {action.daysOverdue === 1 ? 'day' : 'days'} overdue
              </span>
            )}
            <span className="capitalize">{action.entityType}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleQuickAction}
          className={`
            ${colors.icon}
            px-3 py-1.5 rounded-md
            border border-current
            hover:bg-white
            transition-colors
            flex-shrink-0
            opacity-0 group-hover:opacity-100
            focus:opacity-100
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary
          `}
          aria-label={action.actionLabel}
        >
          {action.actionLabel}
        </button>

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-muted-foreground/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
