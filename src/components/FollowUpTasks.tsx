import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User } from '../types';
import { getFollowUpTasks, completeFollowUpTask, type FollowUpTask } from '../lib/phase3Enhancements';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Flame,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Phone,
  Mail,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpTasksProps {
  user: User;
  onNavigateToLead?: (leadId: string) => void;
}

export const FollowUpTasks: React.FC<FollowUpTasksProps> = ({ user, onNavigateToLead }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const allTasks = useMemo(() => {
    const tasks = getFollowUpTasks(user.id, user.role);
    return tasks;
  }, [user.id, user.role, refreshKey]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesStatus && matchesPriority;
    });
  }, [allTasks, filterStatus, filterPriority]);

  const stats = useMemo(() => {
    const pending = allTasks.filter(t => t.status === 'pending').length;
    const overdue = allTasks.filter(t => t.status === 'overdue').length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const high = allTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    
    return { pending, overdue, completed, high };
  }, [allTasks]);

  const handleCompleteTask = (taskId: string) => {
    const success = completeFollowUpTask(taskId);
    if (success) {
      toast.success('Task completed!');
      setRefreshKey(prev => prev + 1);
    } else {
      toast.error('Failed to complete task');
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <ArrowUp className="h-3 w-3" />;
      case 'medium':
        return <ArrowRight className="h-3 w-3" />;
      case 'low':
        return <ArrowDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) {
      const daysPast = Math.floor(Math.abs(diffHours) / 24);
      if (daysPast === 0) return 'Overdue today';
      if (daysPast === 1) return 'Overdue by 1 day';
      return `Overdue by ${daysPast} days`;
    }
    
    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `Due in ${hours}h`;
    }
    
    const days = Math.floor(diffHours / 24);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl text-gray-900 mb-2">Follow-up Tasks</h2>
        <p className="text-sm text-gray-600">Automated and manual follow-up tasks for your leads</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-2xl text-gray-900">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Overdue</p>
                <p className="text-2xl text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">High Priority</p>
                <p className="text-2xl text-orange-600">{stats.high}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-2xl text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filter Tasks</CardTitle>
            <div className="flex items-center gap-3">
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tasks found</p>
              <p className="text-sm mt-1">Tasks will appear here when leads change status or scores update</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 ${
                    task.status === 'overdue' ? 'border-red-300 bg-red-50' :
                    task.status === 'completed' ? 'border-green-300 bg-green-50 opacity-60' :
                    'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Circle className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                          <Badge className={`${getPriorityColor(task.priority)} gap-1`}>
                            {getPriorityIcon(task.priority)}
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          {task.createdBy === 'system' && (
                            <Badge variant="outline" className="text-xs">
                              Auto-created
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDueDate(task.dueDate)}
                        </div>
                        {task.leadName && (
                          <div className="flex items-center gap-1">
                            <span>Lead:</span>
                            <button
                              onClick={() => onNavigateToLead?.(task.leadId)}
                              className="text-blue-600 hover:underline"
                            >
                              {task.leadName}
                            </button>
                          </div>
                        )}
                        {task.propertyTitle && (
                          <div className="flex items-center gap-1">
                            <span>Property:</span>
                            <span className="text-gray-700">{task.propertyTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
