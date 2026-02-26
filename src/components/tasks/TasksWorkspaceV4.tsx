/**
 * TasksWorkspaceV4 Component
 * 
 * Comprehensive ERP-standard task management workspace
 * 
 * FEATURES:
 * - Multiple views: List, Board (Kanban), Calendar
 * - Advanced filtering and search
 * - Bulk operations
 * - Quick actions
 * - Task templates
 * - Real-time statistics
 * - Workload balancing
 * - Smart assignment
 * 
 * DESIGN:
 * - Follows Design System V4.1
 * - Brand colors and typography
 * - Responsive layout
 * - Accessible (WCAG 2.1 AA)
 * 
 * UX LAWS:
 * - Miller's Law: Limited filter options (5-7 max)
 * - Fitts's Law: Large action buttons
 * - Jakob's Law: Familiar task management patterns
 */

import React, { useState, useMemo, useCallback } from 'react';
import { User } from '../../types';
import {
  TaskV4,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskFilters,
  TaskSortOptions,
  TaskStats,
  TaskEntityType,
} from '../../types/tasks';
// [STUBBED] import { getAllTasksV4, updateTask, deleteTask } from '../../lib/tasks';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';
import { WorkspaceSearchBar } from '../workspace/WorkspaceSearchBar';
import { WorkspaceEmptyState } from '../workspace/WorkspaceEmptyState';
import { BulkActionBar } from '../workspace/BulkActionBar';
import { ViewModeSwitcher } from '../workspace/ViewModeSwitcher';
import { TaskListView } from './TaskListView';
import { TaskBoardView } from './TaskBoardView';
import { TaskCalendarView } from './TaskCalendarView';
import { CreateTaskModal } from './CreateTaskModal';
import { BulkEditTasksModal } from './BulkEditTasksModal';
import { TaskTemplateManager } from './TaskTemplateManager';
import { TaskAutomationDashboard } from './TaskAutomationDashboard';
import {
  CheckSquare,
  Plus,
  Calendar,
  Layout,
  List,
  Filter,
  Download,
  Upload,
  FileText,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Tag,
  Repeat,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';

import { logger } from "../../lib/logger";

// ===== STUBS for removed prototype functions =====
const getAllTasksV4 = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateTask = (..._args: any[]): any => { /* stub - prototype function removed */ };
const deleteTask = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====

interface TasksWorkspaceV4Props {
  user: User;
  onNavigate: (page: string, id?: string) => void;
  onCreateTask: () => void;
  onEditTask: (taskId: string) => void;
  onViewTask: (taskId: string) => void;
}

/**
 * Priority color mapping
 */
const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-[#C17052] bg-[#C17052]/10 border-[#C17052]/30';
    case 'medium':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'low':
      return 'text-[#6B7280] bg-gray-50 border-gray-200';
  }
};

/**
 * Status color mapping
 */
const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'not-started':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'in-progress':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'waiting':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'completed':
      return 'text-[#2D6A54] bg-[#2D6A54]/10 border-[#2D6A54]/30';
    case 'cancelled':
      return 'text-gray-500 bg-gray-100 border-gray-300';
    case 'overdue':
      return 'text-red-600 bg-red-50 border-red-200';
  }
};

/**
 * Calculate task statistics
 */
function calculateTaskStats(tasks: TaskV4[]): TaskStats {
  const total = tasks.length;

  // By status
  const byStatus: Record<TaskStatus, number> = {
    'not-started': 0,
    'in-progress': 0,
    'waiting': 0,
    'completed': 0,
    'cancelled': 0,
    'overdue': 0,
  };

  // By priority
  const byPriority: Record<TaskPriority, number> = {
    'urgent': 0,
    'high': 0,
    'medium': 0,
    'low': 0,
  };

  // By category
  const byCategory: Record<TaskCategory, number> = {
    'follow-up': 0,
    'viewing': 0,
    'documentation': 0,
    'negotiation': 0,
    'inspection': 0,
    'meeting': 0,
    'administrative': 0,
    'marketing': 0,
    'financial': 0,
    'legal': 0,
    'custom': 0,
  };

  let overdue = 0;
  let dueToday = 0;
  let dueThisWeek = 0;
  let completed = 0;
  let totalCompletionTime = 0;
  let completionCount = 0;
  let totalTimeTracked = 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  tasks.forEach(task => {
    // Status
    byStatus[task.status]++;

    // Priority
    byPriority[task.priority]++;

    // Category
    byCategory[task.category]++;

    // Overdue
    const dueDate = new Date(task.dueDate);
    if (task.status !== 'completed' && task.status !== 'cancelled' && dueDate < now) {
      overdue++;
    }

    // Due today
    if (dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
      dueToday++;
    }

    // Due this week
    if (dueDate >= today && dueDate <= endOfWeek) {
      dueThisWeek++;
    }

    // Completed
    if (task.status === 'completed') {
      completed++;

      // Completion time
      if (task.completedAt && task.createdAt) {
        const completionTime = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
        totalCompletionTime += completionTime;
        completionCount++;
      }
    }

    // Time tracked
    if (task.actualMinutes) {
      totalTimeTracked += task.actualMinutes / 60; // Convert to hours
    }
  });

  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  const avgCompletionTime = completionCount > 0
    ? totalCompletionTime / completionCount / (1000 * 60 * 60) // Convert to hours
    : 0;

  return {
    total,
    byStatus,
    byPriority,
    byCategory,
    overdue,
    dueToday,
    dueThisWeek,
    completionRate,
    avgCompletionTime,
    totalTimeTracked,
  };
}

/**
 * Filter tasks based on filters
 */
function filterTasks(tasks: TaskV4[], filters: TaskFilters): TaskV4[] {
  return tasks.filter(task => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(task.status)) return false;
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(task.priority)) return false;
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      if (!filters.category.includes(task.category)) return false;
    }

    // Assigned to filter
    if (filters.assignedTo && filters.assignedTo.length > 0) {
      const hasMatch = filters.assignedTo.some(userId =>
        task.assignedTo.includes(userId) || task.agentId === userId
      );
      if (!hasMatch) return false;
    }

    // Entity type filter
    if (filters.entityType && filters.entityType.length > 0) {
      if (!task.entityType || !filters.entityType.includes(task.entityType)) return false;
    }

    // Entity ID filter
    if (filters.entityId) {
      if (task.entityId !== filters.entityId) return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatch = filters.tags.some(tag => task.tags.includes(tag));
      if (!hasMatch) return false;
    }

    // Due date range filter
    if (filters.dueDateRange) {
      const dueDate = new Date(task.dueDate);

      if (filters.dueDateRange.start) {
        const start = new Date(filters.dueDateRange.start);
        if (dueDate < start) return false;
      }

      if (filters.dueDateRange.end) {
        const end = new Date(filters.dueDateRange.end);
        if (dueDate > end) return false;
      }
    }

    // Overdue filter
    if (filters.isOverdue !== undefined) {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const isOverdue = task.status !== 'completed' && task.status !== 'cancelled' && dueDate < now;
      if (filters.isOverdue !== isOverdue) return false;
    }

    // Has subtasks filter
    if (filters.hasSubtasks !== undefined) {
      if (filters.hasSubtasks !== task.hasSubtasks) return false;
    }

    // Recurring filter
    if (filters.isRecurring !== undefined) {
      if (filters.isRecurring !== task.isRecurring) return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDescription = task.description?.toLowerCase().includes(searchLower) || false;
      const matchesEntity = task.entityName?.toLowerCase().includes(searchLower) || false;
      const matchesTags = task.tags.some(tag => tag.toLowerCase().includes(searchLower));

      if (!matchesTitle && !matchesDescription && !matchesEntity && !matchesTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort tasks
 */
function sortTasks(tasks: TaskV4[], sortOptions: TaskSortOptions): TaskV4[] {
  const { field, direction } = sortOptions;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;

      case 'priority': {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      }

      case 'status': {
        const statusOrder: Record<TaskStatus, number> = {
          'overdue': 0,
          'in-progress': 1,
          'not-started': 2,
          'waiting': 3,
          'completed': 4,
          'cancelled': 5,
        };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      }

      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;

      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;

      case 'progress':
        comparison = a.progress - b.progress;
        break;
    }

    return comparison * multiplier;
  });
}

/**
 * TasksWorkspaceV4 Component
 */
export const TasksWorkspaceV4: React.FC<TasksWorkspaceV4Props> = ({
  user,
  onNavigate,
  onCreateTask,
  onEditTask,
  onViewTask,
}) => {
  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');

  // Filters and sorting
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sortOptions, setSortOptions] = useState<TaskSortOptions>({
    field: 'dueDate',
    direction: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Selected tasks for bulk operations
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Bulk edit modal
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);

  // Template manager modal
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);

  // Automation dashboard modal
  const [automationOpen, setAutomationOpen] = useState(false);

  // Load tasks from localStorage (placeholder - will be implemented in lib)
  const allTasks: TaskV4[] = getAllTasksV4(user.id, user.role);

  // Apply filters and search
  const filteredTasks = useMemo(() => {
    const filtered = filterTasks(allTasks, { ...filters, search: searchQuery });
    return sortTasks(filtered, sortOptions);
  }, [allTasks, filters, searchQuery, sortOptions]);

  // Calculate statistics
  const stats = useMemo(() => calculateTaskStats(filteredTasks), [filteredTasks]);

  // Quick filter buttons
  const quickFilters = [
    {
      id: 'my-tasks',
      label: 'My Tasks',
      icon: <Users className="h-4 w-4" />,
      count: allTasks.filter(t => t.agentId === user.id).length,
      active: filters.assignedTo?.includes(user.id) || false,
      onClick: () => {
        setFilters(prev => ({
          ...prev,
          assignedTo: prev.assignedTo?.includes(user.id)
            ? prev.assignedTo.filter(id => id !== user.id)
            : [user.id],
        }));
      },
    },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: <AlertCircle className="h-4 w-4" />,
      count: stats.overdue,
      active: filters.isOverdue || false,
      onClick: () => {
        setFilters(prev => ({ ...prev, isOverdue: !prev.isOverdue }));
      },
    },
    {
      id: 'due-today',
      label: 'Due Today',
      icon: <Clock className="h-4 w-4" />,
      count: stats.dueToday,
      active: false,
      onClick: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFilters(prev => ({
          ...prev,
          dueDateRange: {
            start: today.toISOString(),
            end: tomorrow.toISOString(),
          },
        }));
      },
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      icon: <TrendingUp className="h-4 w-4" />,
      count: stats.byStatus['in-progress'],
      active: filters.status?.includes('in-progress') || false,
      onClick: () => {
        setFilters(prev => ({
          ...prev,
          status: prev.status?.includes('in-progress')
            ? prev.status.filter(s => s !== 'in-progress')
            : ['in-progress'],
        }));
      },
    },
    {
      id: 'high-priority',
      label: 'High Priority',
      icon: <AlertCircle className="h-4 w-4" />,
      count: stats.byPriority.urgent + stats.byPriority.high,
      active: filters.priority?.includes('urgent') || filters.priority?.includes('high') || false,
      onClick: () => {
        setFilters(prev => ({
          ...prev,
          priority: ['urgent', 'high'],
        }));
      },
    },
  ];

  // Sort options for dropdown
  const sortOptionsDropdown = [
    { value: 'dueDate-asc', label: 'Due Date (Earliest)' },
    { value: 'dueDate-desc', label: 'Due Date (Latest)' },
    { value: 'priority-asc', label: 'Priority (High to Low)' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'status-asc', label: 'Status' },
    { value: 'progress-desc', label: 'Progress (High to Low)' },
  ];

  // Handle clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  // Handle sort change from dropdown
  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-') as [any, 'asc' | 'desc'];
    setSortOptions({ field, direction });
  };

  // Get current sort value for dropdown
  const currentSortValue = `${sortOptions.field}-${sortOptions.direction}`;

  // Handle bulk operations
  const handleBulkComplete = () => {
    selectedTasks.forEach(taskId => {
      updateTask(taskId, { status: 'completed' }, user);
    });
    toast.success(`${selectedTasks.length} tasks marked as complete`);
    setSelectedTasks([]);
  };

  const handleBulkDelete = () => {
    selectedTasks.forEach(taskId => {
      deleteTask(taskId);
    });
    toast.success(`${selectedTasks.length} tasks deleted`);
    setSelectedTasks([]);
  };

  const handleBulkAssign = () => {
    // TODO: Open bulk assign modal
    logger.log('Bulk assign:', selectedTasks);
  };

  const handleBulkEdit = () => {
    setBulkEditModalOpen(true);
  };

  // Handle individual task operations
  const handleTaskSelect = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev =>
      selected
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedTasks(selected ? filteredTasks.map(t => t.id) : []);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    const updated = updateTask(taskId, { status }, user);
    if (updated) {
      toast.success('Task status updated');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const success = deleteTask(taskId);
    if (success) {
      toast.success('Task deleted');
    }
  };

  const handleDateClick = (date: Date) => {
    // Navigate to create task with pre-filled date
    onCreateTask();
  };

  // Empty state
  if (allTasks.length === 0) {
    return (
      <div className="min-h-screen bg-[#E8E2D5]/30">
        <WorkspaceHeader
          title="Tasks"
          description="Manage and organize all your tasks"
          stats={[
            { label: 'Total', value: 0, variant: 'default' as const },
            { label: 'Overdue', value: 0, variant: 'danger' as const },
            { label: 'Completed', value: 0, variant: 'success' as const },
          ]}
          primaryAction={{
            label: 'Create Task',
            icon: <Plus className="h-4 w-4" />,
            onClick: onCreateTask,
          }}
          secondaryActions={[
            {
              label: 'Templates',
              icon: <FileText className="h-4 w-4" />,
              onClick: () => logger.log('Templates'),
            },
            {
              label: 'Automation',
              icon: <Repeat className="h-4 w-4" />,
              onClick: () => setAutomationOpen(true),
            },
          ]}
        />

        <div className="p-6">
          <WorkspaceEmptyState
            variant="empty"
            title="No tasks yet"
            description="Create your first task to get started with task management"
            primaryAction={{
              label: 'Create Task',
              onClick: onCreateTask,
            }}
            guideItems={[
              'Create tasks for follow-ups, viewings, and meetings',
              'Assign tasks to team members',
              'Track progress and time spent',
              'Use templates for recurring tasks',
              'Set up automation rules',
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8E2D5]/30">
      {/* Header */}
      <WorkspaceHeader
        title="Tasks"
        description="Manage and organize all your tasks"
        stats={[
          { label: 'Total', value: stats.total, variant: 'default' as const },
          { label: 'Overdue', value: stats.overdue, variant: 'danger' as const },
          { label: 'Due Today', value: stats.dueToday, variant: 'warning' as const },
          { label: 'In Progress', value: stats.byStatus['in-progress'], variant: 'info' as const },
          { label: 'Completed', value: `${stats.completionRate.toFixed(0)}%`, variant: 'success' as const },
        ]}
        primaryAction={{
          label: 'Create Task',
          icon: <Plus className="h-4 w-4" />,
          onClick: onCreateTask,
        }}
        secondaryActions={[
          {
            label: 'Templates',
            icon: <FileText className="h-4 w-4" />,
            onClick: () => setTemplateManagerOpen(true),
          },
          {
            label: 'Automation',
            icon: <Repeat className="h-4 w-4" />,
            onClick: () => setAutomationOpen(true),
          },
          {
            label: 'Import',
            icon: <Upload className="h-4 w-4" />,
            onClick: () => logger.log('Import'),
          },
          {
            label: 'Export',
            icon: <Download className="h-4 w-4" />,
            onClick: () => logger.log('Export'),
          },
        ]}
        viewMode={viewMode === 'list' ? 'table' : viewMode === 'board' ? 'kanban' : 'grid'}
        onViewModeChange={(mode) => setViewMode(mode === 'table' ? 'list' : mode === 'kanban' ? 'board' : 'calendar')}
      />

      {/* Search and filters */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <WorkspaceSearchBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search tasks by title, description, tags..."
          sortOptions={sortOptionsDropdown}
          sortValue={currentSortValue}
          onSortChange={handleSortChange}
          onClearAll={handleClearFilters}
        />
      </div>

      {/* Bulk action bar */}
      {selectedTasks.length > 0 && (
        <BulkActionBar
          selectedCount={selectedTasks.length}
          onClearSelection={() => setSelectedTasks([])}
          actions={[
            {
              label: 'Complete',
              icon: <CheckSquare className="h-4 w-4" />,
              onClick: handleBulkComplete,
              variant: 'default',
            },
            {
              label: 'Assign',
              icon: <Users className="h-4 w-4" />,
              onClick: handleBulkAssign,
              variant: 'default',
            },
            {
              label: 'Edit',
              icon: <FileText className="h-4 w-4" />,
              onClick: handleBulkEdit,
              variant: 'default',
            },
            {
              label: 'Delete',
              icon: <AlertCircle className="h-4 w-4" />,
              onClick: handleBulkDelete,
              variant: 'destructive',
            },
          ]}
        />
      )}

      {/* Content */}
      <div className="p-6">
        {filteredTasks.length === 0 ? (
          <WorkspaceEmptyState
            variant="no-results"
            title="No tasks found"
            description="Try adjusting your filters or search query"
            primaryAction={{
              label: 'Clear Filters',
              onClick: handleClearFilters,
            }}
          />
        ) : (
          <Tabs value={viewMode} className="space-y-4">
            <TabsContent value="list" className="space-y-4">
              <TaskListView
                tasks={filteredTasks}
                selectedTasks={selectedTasks}
                onTaskSelect={handleTaskSelect}
                onSelectAll={handleSelectAll}
                onViewTask={onViewTask}
                onEditTask={onEditTask}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>

            <TabsContent value="board" className="space-y-4">
              <TaskBoardView
                tasks={filteredTasks}
                onViewTask={onViewTask}
                onEditTask={onEditTask}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <TaskCalendarView
                tasks={filteredTasks}
                onViewTask={onViewTask}
                onDateClick={handleDateClick}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Bulk Edit Modal */}
      {bulkEditModalOpen && (
        <BulkEditTasksModal
          open={bulkEditModalOpen}
          onClose={() => setBulkEditModalOpen(false)}
          taskIds={selectedTasks}
          user={user}
          onTasksUpdated={() => {
            // Refresh tasks
            setSelectedTasks([]);
          }}
        />
      )}

      {/* Template Manager Modal */}
      {templateManagerOpen && (
        <TaskTemplateManager
          user={user}
          onClose={() => setTemplateManagerOpen(false)}
        />
      )}
      {/* Task Automation Dashboard */}
      <TaskAutomationDashboard
        user={user}
        open={automationOpen}
        onClose={() => setAutomationOpen(false)}
      />
    </div>
  );
};