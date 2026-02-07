/**
 * WorkspaceKanbanCard Component
 * PHASE 5.3: Data Display Components ✅
 * 
 * PURPOSE:
 * Specialized card component for Kanban view. More compact than WorkspaceCard,
 * optimized for vertical stacking in columns.
 * 
 * FEATURES:
 * - Compact layout
 * - Avatar support
 * - Priority indicators
 * - Due date badges
 * - Progress bars
 * - Quick metrics
 * - Drag handle (future)
 * 
 * UX LAWS:
 * - Miller's Law: Max 3-4 info items
 * - Fitts's Law: Entire card clickable
 * - Aesthetic-Usability: Compact but readable
 */

import React from 'react';
import { Clock, AlertCircle, CheckCircle, Circle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';

export interface WorkspaceKanbanCardProps {
  /** Card ID */
  id: string;
  /** Card title (required) */
  title: string;
  /** Card reference/number */
  reference?: string;
  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  /** Status indicator */
  status?: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  };
  /** Assigned user */
  assignee?: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  /** Due date */
  dueDate?: string;
  /** Is overdue */
  isOverdue?: boolean;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Metrics (max 3) */
  metrics?: Array<{
    icon?: React.ReactNode;
    label: string;
    value: string | number;
  }>;
  /** Tags */
  tags?: string[];
  /** Click handler */
  onClick?: () => void;
  /** Selected state */
  isSelected?: boolean;
  /** Drag & drop handlers (future) */
  draggable?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * WorkspaceKanbanCard - Compact card for Kanban columns
 */
export const WorkspaceKanbanCard = React.memo<WorkspaceKanbanCardProps>(({
  id,
  title,
  reference,
  priority,
  status,
  assignee,
  dueDate,
  isOverdue = false,
  progress,
  metrics = [],
  tags = [],
  onClick,
  isSelected = false,
  draggable = false,
  className,
}) => {
  // Priority colors
  const priorityConfig = {
    low: { color: 'bg-muted', label: 'Low' },
    medium: { color: 'bg-info', label: 'Medium' },
    high: { color: 'bg-warning', label: 'High' },
    urgent: { color: 'bg-destructive', label: 'Urgent' },
  };

  const priorityInfo = priority ? priorityConfig[priority] : null;
  const visibleMetrics = metrics.slice(0, 3); // Miller's Law
  const visibleTags = tags.slice(0, 2);

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200',
        'hover:shadow-md hover:border-gray-300',
        onClick && 'cursor-pointer',
        isSelected && 'ring-2 ring-blue-500 border-blue-500',
        draggable && 'cursor-move',
        className
      )}
      onClick={onClick}
    >
      {/* Header: Reference + Priority */}
      <div className="flex items-center justify-between mb-2">
        {reference && (
          <span className="text-gray-500 font-mono" style={{ fontSize: 'var(--text-xs)' }}>
            {reference}
          </span>
        )}
        {priorityInfo && (
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', priorityInfo.color)} />
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {title}
      </h4>

      {/* Status Badge */}
      {status && (
        <div className="mb-3">
          <Badge variant={status.variant || 'default'} style={{ fontSize: 'var(--text-xs)' }}>
            {status.label}
          </Badge>
        </div>
      )}

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {visibleTags.map((tag, index) => (
            <Badge key={index} variant="secondary" style={{ fontSize: 'var(--text-xs)' }}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-gray-600 mb-1" style={{ fontSize: 'var(--text-xs)' }}>
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all',
                progress >= 100 ? 'bg-success' :
                progress >= 50 ? 'bg-info' :
                'bg-muted'
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics */}
      {visibleMetrics.length > 0 && (
        <div className="space-y-1 mb-3">
          {visibleMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between" style={{ fontSize: 'var(--text-xs)' }}>
              <span className="text-gray-600 flex items-center gap-1">
                {metric.icon && <span className="text-gray-400">{metric.icon}</span>}
                {metric.label}
              </span>
              <span className="font-medium text-gray-900">
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer: Assignee + Due Date */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {/* Assignee */}
        {assignee && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
              <AvatarFallback style={{ fontSize: 'var(--text-xs)' }}>
                {assignee.initials || assignee.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-gray-600 truncate max-w-[100px]" style={{ fontSize: 'var(--text-xs)' }}>
              {assignee.name}
            </span>
          </div>
        )}

        {/* Due Date */}
        {dueDate && (
          <div className={cn(
            'flex items-center gap-1',
            isOverdue ? 'text-destructive-foreground' : 'text-gray-600'
          )}
          style={{ fontSize: 'var(--text-xs)' }}>
            <Clock className="h-3 w-3" />
            <span>{dueDate}</span>
          </div>
        )}
      </div>
    </div>
  );
});

WorkspaceKanbanCard.displayName = 'WorkspaceKanbanCard';

// ==================== LOADING SKELETON ====================

export const WorkspaceKanbanCardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-4 space-y-3', className)}>
      {/* Reference */}
      <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
      
      {/* Title */}
      <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      
      {/* Metrics */}
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
      </div>
    </div>
  );
};
