/**
 * TaskBoardView Component
 * 
 * Kanban-style board view for tasks with:
 * - Drag and drop (future enhancement)
 * - Status-based columns
 * - Task cards
 * - WIP limits
 * - Column summaries
 */

import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/tasks';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import {
  CheckSquare,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  AlertCircle,
  Tag,
  MoreVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface TaskBoardViewProps {
  tasks: Task[];
  onViewTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

/**
 * Board columns configuration
 */
const BOARD_COLUMNS: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'not-started', title: 'Not Started', color: 'bg-gray-100 border-gray-300' },
  { status: 'in-progress', title: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  { status: 'waiting', title: 'Waiting', color: 'bg-amber-50 border-amber-300' },
  { status: 'completed', title: 'Completed', color: 'bg-[#2D6A54]/10 border-[#2D6A54]/30' },
];

/**
 * Get priority color
 */
function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'urgent':
      return 'border-l-4 border-l-red-500';
    case 'high':
      return 'border-l-4 border-l-[#C17052]';
    case 'medium':
      return 'border-l-4 border-l-amber-500';
    case 'low':
      return 'border-l-4 border-l-gray-400';
  }
}

/**
 * Task Card Component
 */
const TaskCard: React.FC<{
  task: Task;
  onView: () => void;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => void;
}> = ({ task, onView, onEdit, onStatusChange }) => {
  const isOverdue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.dueDate) < new Date();
  
  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-[#1A1D1F] mb-1 line-clamp-2">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm text-[#6B7280] line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange('not-started'); }}>
              Move to Not Started
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange('in-progress'); }}>
              Move to In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange('waiting'); }}>
              Move to Waiting
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange('completed'); }}>
              Move to Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Priority Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          {task.priority.toUpperCase()}
        </Badge>
        
        {task.category && (
          <Badge variant="outline" className="text-xs">
            {task.category}
          </Badge>
        )}
        
        {isOverdue && (
          <Badge variant="destructive" className="text-xs">
            OVERDUE
          </Badge>
        )}
      </div>
      
      {/* Progress */}
      {task.progress > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-1.5" />
        </div>
      )}
      
      {/* Checklist */}
      {task.checklist.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <CheckSquare className="h-4 w-4" />
          <span>
            {task.checklist.filter(i => i.completed).length}/{task.checklist.length} completed
          </span>
        </div>
      )}
      
      {/* Due Date */}
      <div className={`flex items-center gap-2 text-sm mb-3 ${isOverdue ? 'text-red-600' : 'text-[#6B7280]'}`}>
        <Calendar className="h-4 w-4" />
        <span>
          {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
        </span>
      </div>
      
      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{task.tags.length - 2}
            </Badge>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
          {task.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
          
          {task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-[#6B7280]" />
          <span className="text-xs text-[#6B7280]">{task.assignedTo.length}</span>
        </div>
      </div>
    </Card>
  );
};

/**
 * TaskBoardView Component
 */
export const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  tasks,
  onViewTask,
  onEditTask,
  onStatusChange,
}) => {
  // Group tasks by status
  const tasksByStatus = BOARD_COLUMNS.reduce((acc, column) => {
    acc[column.status] = tasks.filter(t => {
      // Handle overdue tasks
      if (t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate) < new Date()) {
        return column.status === 'not-started'; // Show overdue in "Not Started"
      }
      return t.status === column.status;
    });
    return acc;
  }, {} as Record<TaskStatus, Task[]>);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {BOARD_COLUMNS.map((column) => {
        const columnTasks = tasksByStatus[column.status] || [];
        
        return (
          <div key={column.status} className="flex flex-col">
            {/* Column Header */}
            <div className={`p-4 rounded-t-lg border-2 ${column.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1A1D1F]">{column.title}</h3>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>
            </div>
            
            {/* Column Body */}
            <ScrollArea className="flex-1 p-4 bg-gray-50/50 rounded-b-lg border-2 border-t-0 border-gray-200 min-h-[500px]">
              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-[#6B7280]">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tasks</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onView={() => onViewTask(task.id)}
                      onEdit={() => onEditTask(task.id)}
                      onStatusChange={(status) => onStatusChange(task.id, status)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
};
