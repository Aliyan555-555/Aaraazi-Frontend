/**
 * TaskDetailsV4 Component
 * 
 * Comprehensive task details page with:
 * - Full task information display
 * - Subtasks management
 * - Task dependencies
 * - Activity timeline
 * - Time tracking
 * - Comments and collaboration
 * - Attachments
 * - Related entities
 * 
 * DESIGN: Design System V4.1 compliant
 * ACCESSIBILITY: WCAG 2.1 AA compliant
 */

import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { TaskV4, TaskStatus, TaskPriority } from '../../types/tasks';
// [STUBBED] import { getTaskById, getSubtasks, updateTask, addTaskComment, addTimeEntry, updateChecklistItem } from '../../lib/tasks';
import { PageHeader } from '../layout/PageHeader';
import { ConnectedEntitiesBar } from '../layout/ConnectedEntitiesBar';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import {
  CheckSquare,
  Clock,
  Calendar,
  User as UserIcon,
  Tag,
  Link2,
  MessageSquare,
  Paperclip,
  Play,
  Pause,
  Edit,
  Trash2,
  MoreVertical,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { logger } from "../../lib/logger";

// ===== STUBS for removed prototype functions =====
const getTaskById = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getSubtasks = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateTask = (..._args: any[]): any => { /* stub - prototype function removed */ };
const addTaskComment = (..._args: any[]): any => { /* stub - prototype function removed */ };
const addTimeEntry = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateChecklistItem = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====

interface TaskDetailsV4Props {
  taskId: string;
  user: User;
  onNavigate: (page: string, id?: string) => void;
  onBack: () => void;
  onEdit: (taskId: string) => void;
}

/**
 * Get priority badge variant
 */
function getPriorityVariant(priority: TaskPriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'high':
      return 'bg-[#C17052]/10 text-[#C17052] border-[#C17052]/30';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'low':
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: TaskStatus): string {
  switch (status) {
    case 'not-started':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'in-progress':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'waiting':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'completed':
      return 'bg-[#2D6A54]/10 text-[#2D6A54] border-[#2D6A54]/30';
    case 'cancelled':
      return 'bg-gray-200 text-gray-600 border-gray-400';
    case 'overdue':
      return 'bg-red-100 text-red-700 border-red-300';
  }
}

/**
 * Format duration in minutes to readable string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

/**
 * TaskDetailsV4 Component
 */
export const TaskDetailsV4: React.FC<TaskDetailsV4Props> = ({
  taskId,
  user,
  onNavigate,
  onBack,
  onEdit,
}) => {
  const [task, setTask] = useState<TaskV4 | null>(() => getTaskById(taskId));
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  
  // Load subtasks
  const subtasks = useMemo(() => getSubtasks(taskId), [taskId]);
  
  if (!task) {
    return (
      <div className="min-h-screen bg-[#E8E2D5]/30 p-6">
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#1A1D1F] mb-2">Task not found</h3>
          <p className="text-[#6B7280] mb-4">
            The task you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </Card>
      </div>
    );
  }
  
  // Check if overdue
  const isOverdue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.dueDate) < new Date();
  const actualStatus = isOverdue ? 'overdue' : task.status;
  
  // Calculate time estimates
  const estimatedTime = task.estimatedMinutes || 0;
  const actualTime = task.actualMinutes || 0;
  const timeVariance = actualTime - estimatedTime;
  
  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Tasks', onClick: () => onNavigate('tasks') },
    { label: task.title },
  ];
  
  // Metrics
  const metrics = [
    {
      label: 'Progress',
      value: `${task.progress}%`,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: 'Priority',
      value: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
      icon: <AlertCircle className="h-4 w-4" />,
    },
    {
      label: 'Status',
      value: actualStatus.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      icon: <CheckSquare className="h-4 w-4" />,
    },
    {
      label: 'Due Date',
      value: new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      icon: <Calendar className="h-4 w-4" />,
    },
  ];
  
  // Primary actions
  const primaryActions = [
    {
      label: 'Edit Task',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => onEdit(taskId),
    },
  ];
  
  // Secondary actions
  const secondaryActions = [
    {
      label: task.status === 'completed' ? 'Reopen' : 'Mark Complete',
      icon: <CheckSquare className="h-4 w-4" />,
      onClick: () => handleStatusChange(task.status === 'completed' ? 'in-progress' : 'completed'),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => logger.log('Delete task'),
    },
  ];
  
  // Connected entities
  const connectedEntities = [];
  
  if (task.entityType && task.entityId) {
    connectedEntities.push({
      type: task.entityType,
      name: task.entityName || task.entityId,
      onClick: () => {
        // Navigate to entity
        if (task.entityType === 'property') onNavigate('property-details', task.entityId);
        else if (task.entityType === 'lead') onNavigate('lead-details', task.entityId);
        else if (task.entityType === 'contact') onNavigate('contact-details', task.entityId);
        else if (task.entityType === 'deal') onNavigate('deal-details', task.entityId);
      },
    });
  }
  
  // Handle status change
  const handleStatusChange = (newStatus: TaskStatus) => {
    const updated = updateTask(taskId, { status: newStatus }, user);
    if (updated) {
      setTask(updated);
    }
  };
  
  // Handle comment submit
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addTaskComment(taskId, newComment, user);
    const updated = getTaskById(taskId);
    if (updated) {
      setTask(updated);
    }
    setNewComment('');
  };
  
  // Handle checklist toggle
  const handleChecklistToggle = (itemId: string, completed: boolean) => {
    updateChecklistItem(taskId, itemId, completed, user);
    const updated = getTaskById(taskId);
    if (updated) {
      setTask(updated);
    }
  };
  
  // Handle timer
  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setTimerStart(new Date());
  };
  
  const handleStopTimer = () => {
    if (!timerStart) return;
    
    const duration = Math.round((new Date().getTime() - timerStart.getTime()) / (1000 * 60));
    
    addTimeEntry(taskId, {
      taskId,
      userId: user.id,
      userName: user.name,
      startTime: timerStart.toISOString(),
      endTime: new Date().toISOString(),
      duration,
      billable: false,
    }, user);
    
    const updated = getTaskById(taskId);
    if (updated) {
      setTask(updated);
    }
    
    setIsTimerRunning(false);
    setTimerStart(null);
  };
  
  return (
    <div className="min-h-screen bg-[#E8E2D5]/30">
      {/* Page Header */}
      <PageHeader
        title={task.title}
        breadcrumbs={breadcrumbs}
        metrics={metrics}
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
        onBack={onBack}
      />
      
      {/* Connected Entities */}
      {connectedEntities.length > 0 && (
        <ConnectedEntitiesBar entities={connectedEntities} />
      )}
      
      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityVariant(task.priority)}>
                      {task.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusVariant(actualStatus)}>
                      {actualStatus.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                    {task.isRecurring && (
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        Recurring
                      </Badge>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-[#363F47] mb-4">{task.description}</p>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">Progress</span>
                      <span className="font-medium text-[#1A1D1F]">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="checklist">
                  Checklist
                  {task.checklist.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="comments">
                  Comments
                  {task.comments.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{task.comments.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="time">Time Tracking</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-[#1A1D1F] mb-4">Details</h3>
                  
                  <div className="space-y-4">
                    {/* Category */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Category</span>
                      <span className="font-medium text-[#1A1D1F]">
                        {task.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    {/* Assigned To */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Assigned To</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#6B7280]" />
                        <span className="font-medium text-[#1A1D1F]">
                          {task.assignedTo.length} {task.assignedTo.length === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Created */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Created</span>
                      <span className="text-[#363F47]">
                        {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    {/* Updated */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Last Updated</span>
                      <span className="text-[#363F47]">
                        {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {task.completedAt && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B7280]">Completed</span>
                          <span className="text-[#2D6A54]">
                            {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
                
                {/* Tags */}
                {task.tags.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-medium text-[#1A1D1F] mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
                
                {/* Subtasks */}
                {subtasks.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-medium text-[#1A1D1F] mb-4">
                      Subtasks ({subtasks.filter(t => t.status === 'completed').length}/{subtasks.length})
                    </h3>
                    <div className="space-y-2">
                      {subtasks.map(subtask => (
                        <div
                          key={subtask.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => onNavigate('task-details', subtask.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={subtask.status === 'completed'}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className={subtask.status === 'completed' ? 'line-through text-[#6B7280]' : 'text-[#1A1D1F]'}>
                              {subtask.title}
                            </span>
                          </div>
                          <Badge className={getPriorityVariant(subtask.priority)} size="sm">
                            {subtask.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>
              
              {/* Checklist Tab */}
              <TabsContent value="checklist" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-[#1A1D1F] mb-4">
                    Checklist ({task.checklist.filter(i => i.completed).length}/{task.checklist.length} completed)
                  </h3>
                  
                  {task.checklist.length === 0 ? (
                    <p className="text-[#6B7280] text-center py-8">No checklist items</p>
                  ) : (
                    <div className="space-y-3">
                      {task.checklist.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={(checked) => handleChecklistToggle(item.id, checked as boolean)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className={item.completed ? 'line-through text-[#6B7280]' : 'text-[#1A1D1F]'}>
                              {item.title}
                            </p>
                            {item.completedAt && (
                              <p className="text-sm text-[#6B7280] mt-1">
                                Completed {formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              {/* Comments Tab */}
              <TabsContent value="comments" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-[#1A1D1F] mb-4">Comments</h3>
                  
                  {/* Add Comment */}
                  <div className="space-y-3 mb-6">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Comment
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Comments List */}
                  {task.comments.length === 0 ? (
                    <p className="text-[#6B7280] text-center py-8">No comments yet</p>
                  ) : (
                    <div className="space-y-4">
                      {task.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#C17052]/10 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-4 w-4 text-[#C17052]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-[#1A1D1F]">{comment.userName}</span>
                              <span className="text-sm text-[#6B7280]">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-[#363F47]">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              {/* Time Tracking Tab */}
              <TabsContent value="time" className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-[#1A1D1F]">Time Tracking</h3>
                    
                    {isTimerRunning ? (
                      <Button variant="destructive" onClick={handleStopTimer}>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Timer
                      </Button>
                    ) : (
                      <Button onClick={handleStartTimer}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Timer
                      </Button>
                    )}
                  </div>
                  
                  {/* Time Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-sm text-[#6B7280] mb-1">Estimated</p>
                      <p className="text-xl font-semibold text-[#1A1D1F]">
                        {estimatedTime > 0 ? formatDuration(estimatedTime) : '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-sm text-[#6B7280] mb-1">Actual</p>
                      <p className="text-xl font-semibold text-[#1A1D1F]">
                        {actualTime > 0 ? formatDuration(actualTime) : '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-sm text-[#6B7280] mb-1">Variance</p>
                      <p className={`text-xl font-semibold ${timeVariance > 0 ? 'text-red-600' : timeVariance < 0 ? 'text-[#2D6A54]' : 'text-[#1A1D1F]'}`}>
                        {timeVariance !== 0 ? `${timeVariance > 0 ? '+' : ''}${formatDuration(Math.abs(timeVariance))}` : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Time Entries */}
                  <h4 className="font-medium text-[#1A1D1F] mb-4">Time Entries</h4>
                  
                  {task.timeEntries.length === 0 ? (
                    <p className="text-[#6B7280] text-center py-8">No time entries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {task.timeEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                          <div>
                            <p className="font-medium text-[#1A1D1F]">{entry.userName}</p>
                            <p className="text-sm text-[#6B7280]">
                              {new Date(entry.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            {entry.notes && (
                              <p className="text-sm text-[#363F47] mt-1">{entry.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[#1A1D1F]">
                              {formatDuration(entry.duration || 0)}
                            </p>
                            {entry.billable && (
                              <Badge variant="outline" size="sm" className="mt-1">
                                Billable
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-[#1A1D1F] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Add Subtask
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Link2 className="h-4 w-4 mr-2" />
                  Add Dependency
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach File
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Add Watcher
                </Button>
              </div>
            </Card>
            
            {/* Related Tasks */}
            {task.blockedBy.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium text-[#1A1D1F] mb-4">Blocked By</h3>
                <div className="space-y-2">
                  {task.blockedBy.map(blockedTaskId => {
                    const blockedTask = getTaskById(blockedTaskId);
                    return blockedTask ? (
                      <div
                        key={blockedTaskId}
                        className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => onNavigate('task-details', blockedTaskId)}
                      >
                        <p className="font-medium text-[#1A1D1F] text-sm">{blockedTask.title}</p>
                        <Badge className={`${getStatusVariant(blockedTask.status)} mt-1`} size="sm">
                          {blockedTask.status}
                        </Badge>
                      </div>
                    ) : null;
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
