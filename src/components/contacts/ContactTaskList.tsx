/**
 * ContactTaskList — API-backed task table matching prototype TaskListView
 * Works with tasks.service Task type (PENDING, IN_PROGRESS, etc.)
 */

import React from 'react';
import type { Task, TaskStatus, TaskPriority } from '@/services/tasks.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  CheckSquare,
  User,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

const DISPLAY_STATUS: Record<TaskStatus, string> = {
  PENDING: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  OVERDUE: 'Overdue',
};

function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'URGENT': return 'bg-red-100 text-red-700 border-red-300';
    case 'HIGH': return 'bg-[#C17052]/10 text-[#C17052] border-[#C17052]/30';
    case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'LOW': return 'bg-gray-100 text-gray-600 border-gray-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'PENDING': return 'bg-gray-100 text-gray-600 border-gray-300';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'COMPLETED': return 'bg-[#2D6A54]/10 text-[#2D6A54] border-[#2D6A54]/30';
    case 'CANCELLED': return 'bg-gray-200 text-gray-500 border-gray-400';
    case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

export interface ContactTaskListProps {
  tasks: Task[];
  contactName?: string;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  isDeleting?: boolean;
}

export const ContactTaskList: React.FC<ContactTaskListProps> = ({
  tasks,
  contactName,
  onEdit,
  onDelete,
  onStatusChange,
  isDeleting = false,
}) => {
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Task</TableHead>
            <TableHead className="w-28">Priority</TableHead>
            <TableHead className="w-36">Status</TableHead>
            <TableHead className="w-36">Due Date</TableHead>
            <TableHead className="w-28">Assigned To</TableHead>
            <TableHead className="w-14" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-[#6B7280]">
                No tasks found
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const isOverdue =
                task.status !== 'COMPLETED' &&
                task.status !== 'CANCELLED' &&
                new Date(task.dueDate) < new Date();
              const displayStatus = isOverdue ? 'OVERDUE' : task.status;

              return (
                <TableRow key={task.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="space-y-1">
                      <h4 className="font-medium text-[#1A1D1F]">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-[#6B7280] line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      {contactName && (
                        <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                          <CheckSquare className="h-3 w-3" />
                          Contact: {contactName}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {onStatusChange ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`${getStatusColor(displayStatus)} w-full justify-start border`}
                          >
                            {DISPLAY_STATUS[displayStatus]}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => onStatusChange(task.id, 'PENDING')}
                          >
                            Not Started
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
                          >
                            In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(task.id, 'COMPLETED')}
                          >
                            Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(task.id, 'CANCELLED')}
                          >
                            Cancelled
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge variant="outline" className={getStatusColor(displayStatus)}>
                        {DISPLAY_STATUS[displayStatus]}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#6B7280] shrink-0" />
                      <div>
                        <div className="text-sm text-[#1A1D1F]">
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div
                          className={`text-xs ${
                            isOverdue ? 'text-red-600' : 'text-[#6B7280]'
                          }`}
                        >
                          {formatDistanceToNow(new Date(task.dueDate), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-[#6B7280] shrink-0" />
                      <span className="text-sm text-[#6B7280]">
                        {task.assignedTo?.name ?? 'Unassigned'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(task)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusChange?.(
                              task.id,
                              task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED',
                            )
                          }
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          {task.status === 'COMPLETED' ? 'Reopen' : 'Mark Complete'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(task.id)}
                          className="text-red-600 focus:text-red-600"
                          disabled={isDeleting}
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
