/**
 * Task List Component
 * Display and manage deal tasks
 */

import React, { useState } from 'react';
import { Deal, DealTask } from '../../types/deals';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { PermissionGate } from './PermissionGate';
import {
  CheckSquare,
  Square,
  Clock,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TaskListProps {
  deal: Deal;
  currentUserId: string;
  onToggleTask?: (taskId: string, completed: boolean) => void;
  onAddTask?: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  deal,
  currentUserId,
  onToggleTask,
  onAddTask
}) => {
  const [filterStage, setFilterStage] = useState<string>('current');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Filter tasks
  const filteredTasks = deal.tasks.filter(task => {
    // Stage filter
    if (filterStage === 'current' && task.stage !== deal.lifecycle.stage) {
      return false;
    } else if (filterStage !== 'current' && filterStage !== 'all' && task.stage !== filterStage) {
      return false;
    }

    // Status filter
    if (filterStatus === 'pending' && task.status === 'completed') {
      return false;
    } else if (filterStatus === 'completed' && task.status !== 'completed') {
      return false;
    }

    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }

    return true;
  });

  // Group by status
  const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const getPriorityColor = (priority: DealTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStageDisplay = (stage: string) => {
    return stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Tasks ({filteredTasks.length})
            </CardTitle>

            <PermissionGate
              deal={deal}
              userId={currentUserId}
              permission="canUpdateTasks"
              showMessage={false}
            >
              <Button onClick={onAddTask} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Stage Filter */}
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="current">Current Stage Only</SelectItem>
                <SelectItem value="offer-accepted">Offer Accepted</SelectItem>
                <SelectItem value="agreement-signing">Agreement Signing</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="payment-processing">Payment Processing</SelectItem>
                <SelectItem value="handover-preparation">Handover Prep</SelectItem>
                <SelectItem value="transfer-registration">Transfer Registration</SelectItem>
                <SelectItem value="final-handover">Final Handover</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold">{pendingTasks.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Pending Tasks</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Completed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-red-600">
                {pendingTasks.filter(t => isOverdue(t.dueDate)).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Overdue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  deal={deal}
                  currentUserId={currentUserId}
                  onToggle={onToggleTask}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  deal={deal}
                  currentUserId={currentUserId}
                  onToggle={onToggleTask}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Task Item Component
interface TaskItemProps {
  task: DealTask;
  deal: Deal;
  currentUserId: string;
  onToggle?: (taskId: string, completed: boolean) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, deal, currentUserId, onToggle }) => {
  const isCompleted = task.status === 'completed';
  const overdue = !isCompleted && new Date(task.dueDate) < new Date();

  const getPriorityColor = (priority: DealTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageDisplay = (stage: string) => {
    return stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className={`p-4 border rounded-lg ${isCompleted ? 'bg-gray-50' : overdue ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <PermissionGate
          deal={deal}
          userId={currentUserId}
          permission="canUpdateTasks"
          showMessage={false}
          fallback={
            <div className="mt-1">
              {isCompleted ? (
                <CheckSquare className="h-5 w-5 text-green-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </div>
          }
        >
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onToggle?.(task.id, !!checked)}
            className="mt-1"
          />
        </PermissionGate>

        {/* Task Content */}
        <div className="flex-1 space-y-2">
          {/* Title & Badges */}
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              {overdue && (
                <Badge className="bg-red-100 text-red-800 gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-muted-foreground'}`}>
              {task.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
            <div>
              Stage: {getStageDisplay(task.stage)}
            </div>
            {task.assignedToName && (
              <div>
                Assigned to: {task.assignedToName}
              </div>
            )}
            {isCompleted && task.completedAt && (
              <div className="text-green-600">
                ✓ Completed {new Date(task.completedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
