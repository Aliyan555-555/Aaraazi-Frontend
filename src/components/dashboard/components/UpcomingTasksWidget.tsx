import React, { useMemo, useState } from 'react';
import { User } from '../../../types';
import { TaskV4 } from '../../../types/tasks';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow, isToday, isTomorrow, isPast, format } from 'date-fns';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const getAllTasksV4 = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateTask = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface UpcomingTasksWidgetProps {
  user: User;
  onNavigate: (route: string, id?: string) => void;
}

/**
 * Get priority color
 */
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-destructive-bg text-destructive-foreground border-destructive-border';
    case 'high':
      return 'bg-[#C17052]/10 text-[#C17052] border-[#C17052]/30';
    case 'medium':
      return 'bg-warning-bg text-warning-foreground border-warning-border';
    case 'low':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Format due date with context
 */
function formatDueDate(dueDate: string): { text: string; color: string; icon: React.ReactNode } {
  const date = new Date(dueDate);
  const now = new Date();

  if (isPast(date) && !isToday(date)) {
    return {
      text: `Overdue (${formatDistanceToNow(date)} ago)`,
      color: 'text-destructive-foreground',
      icon: <AlertCircle className="h-3 w-3" />,
    };
  }

  if (isToday(date)) {
    return {
      text: 'Due today',
      color: 'text-warning-foreground',
      icon: <Clock className="h-3 w-3" />,
    };
  }

  if (isTomorrow(date)) {
    return {
      text: 'Due tomorrow',
      color: 'text-info-foreground',
      icon: <Calendar className="h-3 w-3" />,
    };
  }

  return {
    text: `Due ${format(date, 'MMM d')}`,
    color: 'text-gray-600',
    icon: <Calendar className="h-3 w-3" />,
  };
}

/**
 * Get upcoming tasks (next 7 days, not completed)
 */
function getUpcomingTasks(tasks: TaskV4[]): TaskV4[] {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  return tasks
    .filter(task => {
      if (task.status === 'completed' || task.status === 'cancelled') {
        return false;
      }

      const dueDate = new Date(task.dueDate);
      return dueDate <= sevenDaysFromNow;
    })
    .sort((a, b) => {
      // Sort by due date, then by priority
      const dateComparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (dateComparison !== 0) return dateComparison;

      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5); // Show top 5 (Miller's Law)
}

/**
 * Task Row Component
 */
interface TaskRowProps {
  task: TaskV4;
  user: User;
  onComplete: () => void;
  onView: () => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, user, onComplete, onView }) => {
  const [completing, setCompleting] = useState(false);
  const dueInfo = formatDueDate(task.dueDate);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleting(true);

    try {
      updateTask(task.id, { status: 'completed' }, user);
      toast.success('Task completed!');
      onComplete();
    } catch (error) {
      toast.error('Failed to complete task');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      onClick={onView}
      className="w-full p-4 rounded-lg border border-gray-200 hover:border-[#2D6A54]/30 hover:bg-gray-50/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        {/* Complete Checkbox */}
        <button
          onClick={handleComplete}
          disabled={completing}
          className="flex-shrink-0 mt-1 w-5 h-5 rounded border-2 border-gray-300 hover:border-[#2D6A54] hover:bg-[#2D6A54]/10 transition-colors flex items-center justify-center"
        >
          {completing && (
            <div className="w-3 h-3 border-2 border-[#2D6A54] border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-gray-900 line-clamp-1 group-hover:text-[#2D6A54] transition-colors">
              {task.title}
            </h4>
            <Badge
              variant="outline"
              className={`${getPriorityColor(task.priority)} flex-shrink-0`}
              style={{ fontSize: 'var(--text-xs)' }}
            >
              {task.priority}
            </Badge>
          </div>

          <div className="flex items-center gap-4" style={{ fontSize: 'var(--text-sm)' }}>
            {/* Due Date */}
            <div className={`flex items-center gap-1 ${dueInfo.color}`}>
              {dueInfo.icon}
              <span>{dueInfo.text}</span>
            </div>

            {/* Entity */}
            {task.entityName && (
              <div className="flex items-center gap-1 text-gray-500 truncate">
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{task.entityName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * UpcomingTasksWidget Component
 */
export const UpcomingTasksWidget: React.FC<UpcomingTasksWidgetProps> = ({
  user,
  onNavigate,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Load tasks
  const tasks = useMemo(() => getAllTasksV4(user.id, user.role), [user.id, user.role, refreshKey]);

  // Get upcoming tasks
  const upcomingTasks = useMemo(() => getUpcomingTasks([]), []);

  // Handlers
  const handleViewAll = () => {
    onNavigate('tasks');
  };

  const handleViewTask = (taskId: string) => {
    onNavigate('task-details', taskId);
  };

  const handleTaskComplete = () => {
    // Refresh tasks
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info-bg">
            <Clock className="h-5 w-5 text-info-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Upcoming Tasks</h3>
            <p className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>Next 7 days</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="text-[#2D6A54] hover:text-[#2D6A54]/80 hover:bg-[#2D6A54]/10"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Tasks List */}
      {upcomingTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2D6A54]/10 mb-4">
            <CheckCircle2 className="h-8 w-8 text-[#2D6A54]" />
          </div>
          <h4 className="font-medium text-gray-900 mb-2">All Clear!</h4>
          <p className="text-gray-600 max-w-xs mx-auto" style={{ fontSize: 'var(--text-sm)' }}>
            No upcoming tasks in the next 7 days. Great job staying on top of things!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              user={user}
              onComplete={handleTaskComplete}
              onView={() => handleViewTask(task.id)}
            />
          ))}
        </div>
      )}

      {/* Footer - Show if there are more tasks */}
      {upcomingTasks.length > 0 && tasks.length > upcomingTasks.length && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleViewAll}
          >
            View All {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length} Tasks
          </Button>
        </div>
      )}
    </Card>
  );
};