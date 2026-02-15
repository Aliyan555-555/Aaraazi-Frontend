import React, { useMemo } from 'react';
import { User } from '../../../types';
import { TaskV4, TaskStatus } from '../../../types/tasks';
// [STUBBED] import { getAllTasksV4 } from '../../../lib/tasks';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

// ===== STUBS for removed prototype functions =====
const getAllTasksV4 = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface TasksSummaryWidgetProps {
  user: User;
  onNavigate: (route: string) => void;
}

/**
 * Calculate task statistics
 */
function getTaskStats(tasks: TaskV4[]) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const overdue = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    const now = new Date();
    return t.status !== 'completed' && t.status !== 'cancelled' && dueDate < now;
  }).length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dueToday = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate >= today && dueDate < tomorrow && t.status !== 'completed';
  }).length;
  
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    inProgress,
    overdue,
    dueToday,
    completionRate,
  };
}

/**
 * TasksSummaryWidget Component
 */
export const TasksSummaryWidget: React.FC<TasksSummaryWidgetProps> = ({
  user,
  onNavigate,
}) => {
  // Load tasks
  const tasks = useMemo(() => getAllTasksV4(user.id, user.role), [user.id, user.role]);
  
  // Calculate stats
  const stats = useMemo(() => getTaskStats([]), []);

  // Handle view all
  const handleViewAll = () => {
    onNavigate('tasks');
  };

  // Handle overdue click
  const handleOverdueClick = () => {
    onNavigate('tasks?filter=overdue');
  };

  // Handle due today click
  const handleDueTodayClick = () => {
    onNavigate('tasks?filter=due-today');
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#2D6A54]/10">
            <CheckSquare className="h-5 w-5 text-[#2D6A54]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Tasks</h3>
            <p className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>{stats.total} total</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Overdue */}
        <button
          onClick={handleOverdueClick}
          className="p-4 rounded-lg border-2 border-gray-200 hover:border-destructive-border hover:bg-destructive-bg transition-colors text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive-foreground" />
            <span className="font-medium text-gray-700" style={{ fontSize: 'var(--text-sm)' }}>Overdue</span>
          </div>
          <div className="text-destructive-foreground font-medium" style={{ fontSize: 'var(--text-2xl)' }}>
            {stats.overdue}
          </div>
        </button>

        {/* Due Today */}
        <button
          onClick={handleDueTodayClick}
          className="p-4 rounded-lg border-2 border-gray-200 hover:border-warning-border hover:bg-warning-bg transition-colors text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-warning-foreground" />
            <span className="font-medium text-gray-700" style={{ fontSize: 'var(--text-sm)' }}>Due Today</span>
          </div>
          <div className="text-warning-foreground font-medium" style={{ fontSize: 'var(--text-2xl)' }}>
            {stats.dueToday}
          </div>
        </button>

        {/* In Progress */}
        <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-info-foreground" />
            <span className="font-medium text-gray-700" style={{ fontSize: 'var(--text-sm)' }}>In Progress</span>
          </div>
          <div className="text-info-foreground font-medium" style={{ fontSize: 'var(--text-2xl)' }}>
            {stats.inProgress}
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="h-4 w-4 text-[#2D6A54]" />
            <span className="font-medium text-gray-700" style={{ fontSize: 'var(--text-sm)' }}>Completed</span>
          </div>
          <div className="text-[#2D6A54] font-medium" style={{ fontSize: 'var(--text-2xl)' }}>
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700" style={{ fontSize: 'var(--text-sm)' }}>Completion Rate</span>
          <span className="font-medium text-[#2D6A54]" style={{ fontSize: 'var(--text-sm)' }}>
            {stats.completionRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#2D6A54] h-2 rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      {/* Alert for overdue tasks */}
      {stats.overdue > 0 && (
        <div className="mt-4 p-3 bg-destructive-bg border border-destructive-border rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive-foreground flex-shrink-0 mt-0.5" />
          <p className="text-destructive-foreground" style={{ fontSize: 'var(--text-sm)' }}>
            You have <strong>{stats.overdue}</strong> overdue task{stats.overdue > 1 ? 's' : ''} that need attention.
          </p>
        </div>
      )}
    </Card>
  );
};
