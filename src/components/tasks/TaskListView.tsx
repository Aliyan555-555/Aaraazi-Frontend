/**
 * TaskListView Component
 * 
 * Displays tasks in a table/list format with:
 * - Sortable columns
 * - Row selection
 * - Quick actions
 * - Inline status updates
 * - Progress indicators
 */

import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/tasks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  CheckSquare,
  Clock,
  User,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface TaskListViewProps {
  tasks: Task[];
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onViewTask?: (taskId: string) => void;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  showSelection?: boolean;
}

/**
 * Get priority badge classes
 */
function getPriorityBadge(priority: TaskPriority): { variant: string; color: string } {
  switch (priority) {
    case 'urgent':
      return { variant: 'destructive', color: 'bg-red-100 text-red-700 border-red-300' };
    case 'high':
      return { variant: 'default', color: 'bg-[#C17052]/10 text-[#C17052] border-[#C17052]/30' };
    case 'medium':
      return { variant: 'secondary', color: 'bg-amber-100 text-amber-700 border-amber-300' };
    case 'low':
      return { variant: 'outline', color: 'bg-gray-100 text-gray-600 border-gray-300' };
  }
}

/**
 * Get status badge classes
 */
function getStatusBadge(status: TaskStatus): { variant: string; color: string } {
  switch (status) {
    case 'not-started':
      return { variant: 'outline', color: 'bg-gray-100 text-gray-600 border-gray-300' };
    case 'in-progress':
      return { variant: 'default', color: 'bg-blue-100 text-blue-700 border-blue-300' };
    case 'waiting':
      return { variant: 'secondary', color: 'bg-amber-100 text-amber-700 border-amber-300' };
    case 'completed':
      return { variant: 'default', color: 'bg-[#2D6A54]/10 text-[#2D6A54] border-[#2D6A54]/30' };
    case 'cancelled':
      return { variant: 'outline', color: 'bg-gray-200 text-gray-500 border-gray-400' };
    case 'overdue':
      return { variant: 'destructive', color: 'bg-red-100 text-red-700 border-red-300' };
  }
}

/**
 * TaskListView Component
 */
export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  selectedTasks,
  onTaskSelect,
  onSelectAll,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  showSelection = true,
}) => {
  const allSelected = tasks.length > 0 && tasks.every(t => selectedTasks?.includes(t.id));
  const someSelected = tasks.some(t => selectedTasks?.includes(t.id)) && !allSelected;
  
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12">
              {showSelection && (
                <Checkbox
                  checked={allSelected}
                  {...(someSelected ? { indeterminate: true } : {})}
                  onCheckedChange={(checked) => onSelectAll?.(checked as boolean)}
                />
              )}
            </TableHead>
            <TableHead>Task</TableHead>
            <TableHead className="w-32">Priority</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-32">Due Date</TableHead>
            <TableHead className="w-32">Progress</TableHead>
            <TableHead className="w-32">Assigned To</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-[#6B7280]">
                No tasks found
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              // Check if overdue
              const isOverdue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.dueDate) < new Date();
              const displayStatus = isOverdue ? 'overdue' : task.status;
              const priorityBadge = getPriorityBadge(task.priority);
              const statusBadge = getStatusBadge(displayStatus);
              
              return (
                <TableRow
                  key={task.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewTask?.(task.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {showSelection && (
                      <Checkbox
                        checked={selectedTasks?.includes(task.id)}
                        onCheckedChange={(checked) => onTaskSelect?.(task.id, checked as boolean)}
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#1A1D1F]">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-[#6B7280] line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Entity Link */}
                      {task.entityName && (
                        <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                          <CheckSquare className="h-3 w-3" />
                          {task.entityType}: {task.entityName}
                        </div>
                      )}
                      
                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{task.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={priorityBadge.color}>
                      {task.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={`${statusBadge.color} w-full justify-start`}>
                          {displayStatus.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'not-started')}>
                          Not Started
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'in-progress')}>
                          In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'waiting')}>
                          Waiting
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'completed')}>
                          Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'cancelled')}>
                          Cancelled
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#6B7280]" />
                      <div>
                        <div className="text-sm text-[#1A1D1F]">
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className={`text-xs ${isOverdue ? 'text-red-600' : 'text-[#6B7280]'}`}>
                          {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7280]">{task.progress}%</span>
                        {task.checklist.length > 0 && (
                          <span className="text-[#6B7280]">
                            {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                          </span>
                        )}
                      </div>
                      <Progress value={task.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-[#6B7280]" />
                      <span className="text-sm text-[#6B7280]">
                        {task.assignedTo.length}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewTask?.(task.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditTask?.(task.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(task.id, task.status === 'completed' ? 'in-progress' : 'completed')}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          {task.status === 'completed' ? 'Reopen' : 'Mark Complete'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteTask?.(task.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};