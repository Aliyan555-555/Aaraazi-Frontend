/**
 * InsightCard Component
 * 
 * Displays an actionable insight with icon, message, and optional action button.
 * 
 * FEATURES:
 * - 6 insight types (opportunity, warning, achievement, recommendation, alert, info)
 * - Color-coded by type
 * - Priority indicator
 * - Action button (optional)
 * - Supporting data display
 * - Dismissible (optional)
 * 
 * DESIGN:
 * - Follows Design System V4.1
 * - Brand colors
 * - NO Tailwind typography classes
 */

import React, { useState } from 'react';
import { LucideIcon, X, ArrowRight, AlertCircle, Lightbulb, TrendingUp, Award, AlertTriangle, Info } from 'lucide-react';

export type InsightType = 'opportunity' | 'warning' | 'achievement' | 'recommendation' | 'alert' | 'info';
export type InsightPriority = 'high' | 'medium' | 'low';

export interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  data?: {
    label: string;
    value: string | number;
  }[];
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  timestamp?: Date;
}

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (id: string) => void;
}

/**
 * Get insight type styling
 */
function getInsightStyle(type: InsightType): {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  icon: LucideIcon;
} {
  switch (type) {
    case 'opportunity':
      return {
        bg: 'bg-[#C17052]/5',
        border: 'border-[#C17052]/30',
        iconBg: 'bg-[#C17052]/10',
        iconColor: 'text-[#C17052]',
        icon: TrendingUp,
      };
    case 'warning':
      return {
        bg: 'bg-warning-bg',
        border: 'border-warning-border',
        iconBg: 'bg-warning-bg',
        iconColor: 'text-warning-foreground',
        icon: AlertTriangle,
      };
    case 'achievement':
      return {
        bg: 'bg-[#2D6A54]/5',
        border: 'border-[#2D6A54]/30',
        iconBg: 'bg-[#2D6A54]/10',
        iconColor: 'text-[#2D6A54]',
        icon: Award,
      };
    case 'recommendation':
      return {
        bg: 'bg-info-bg',
        border: 'border-info-border',
        iconBg: 'bg-info-bg',
        iconColor: 'text-info-foreground',
        icon: Lightbulb,
      };
    case 'alert':
      return {
        bg: 'bg-destructive-bg',
        border: 'border-destructive-border',
        iconBg: 'bg-destructive-bg',
        iconColor: 'text-destructive-foreground',
        icon: AlertCircle,
      };
    case 'info':
      return {
        bg: 'bg-muted',
        border: 'border-border',
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
        icon: Info,
      };
  }
}

/**
 * Get priority label
 */
function getPriorityBadge(priority: InsightPriority): React.ReactNode | null {
  switch (priority) {
    case 'high':
      return (
        <span className="px-2 py-0.5 bg-destructive-bg text-destructive-foreground rounded" style={{ fontSize: 'var(--text-xs)' }}>
          High Priority
        </span>
      );
    case 'medium':
      return (
        <span className="px-2 py-0.5 bg-warning-bg text-warning-foreground rounded" style={{ fontSize: 'var(--text-xs)' }}>
          Medium
        </span>
      );
    case 'low':
      return null; // Don't show badge for low priority
  }
}

/**
 * InsightCard Component
 */
export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onDismiss,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    id,
    type,
    priority,
    title,
    message,
    data,
    action,
    dismissible = false,
  } = insight;

  const style = getInsightStyle(type);
  const Icon = style.icon;
  const priorityBadge = getPriorityBadge(priority);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss(id);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className={`
        ${style.bg} border ${style.border}
        rounded-lg p-4
        hover:shadow-md transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        {/* Icon */}
        <div className={`${style.iconBg} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`${style.iconColor} h-5 w-5`} />
        </div>

        {/* Title & Priority */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[#1A1D1F]">
              {title}
            </h3>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="text-[#6B7280] hover:text-[#1A1D1F] transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {priorityBadge && (
            <div className="mb-2">
              {priorityBadge}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <p className="text-[#363F47] mb-3 ml-13" style={{ fontSize: 'var(--text-sm)' }}>
        {message}
      </p>

      {/* Supporting Data */}
      {data && data.length > 0 && (
        <div className="ml-13 mb-3 flex flex-wrap gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-baseline gap-1">
              <span className="text-[#1A1D1F]">
                {item.value}
              </span>
              <span className="text-[#6B7280]" style={{ fontSize: 'var(--text-xs)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      {action && (
        <div className="ml-13">
          <button
            onClick={action.onClick}
            className={`
              px-4 py-2 rounded-lg
              ${style.iconColor} ${style.iconBg}
              hover:${style.iconBg.replace('/10', '/20')}
              transition-colors
              flex items-center gap-2
            `}
            style={{ fontSize: 'var(--text-sm)' }}
          >
            <span>{action.label}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
