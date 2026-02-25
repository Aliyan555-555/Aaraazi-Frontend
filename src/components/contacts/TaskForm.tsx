/**
 * TaskForm Component
 * Form for creating and editing tasks related to contacts
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CRMTask, User } from '../../types';
// import { addTask, updateTask, getProperties } from '../../lib/data';
// [STUBBED] import { getProperties } from '../../lib/data';
const getProperties = (..._args: any[]): any[] => [];
import { formatPropertyAddress } from '../../lib/utils';
import { Phone, Calendar, Users, FileText, Home } from 'lucide-react';
import { toast } from 'sonner';

interface TaskFormProps {
  contactId: string;
  user: User;
  task?: CRMTask;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  contactId,
  user,
  task,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'follow-up' as CRMTask['type'],
    priority: task?.priority || 'medium' as CRMTask['priority'],
    status: task?.status || 'pending' as CRMTask['status'],
    dueDate: task?.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toISOString().split('T')[0]) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    propertyId: task?.propertyId || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const properties = getProperties(user.id, user.role);

  const taskTypes = [
    { value: 'follow-up', label: 'Follow-up', icon: Phone },
    { value: 'viewing', label: 'Property Viewing', icon: Home },
    { value: 'meeting', label: 'Meeting', icon: Users },
    { value: 'document', label: 'Document', icon: FileText },
    { value: 'other', label: 'Other', icon: Calendar },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (task) {
        // Update existing task
        // TODO: Implement updateTask API call
        const success = false; // updateTask(task.id, formData);
        if (success) {
          toast.success('Task updated successfully');
          onSuccess();
        } else {
          toast.error('Failed to update task');
        }
      } else {
        // Create new task
        // TODO: Implement addTask API call
        const newTask = null; // addTask({ ...formData, contactId, agentId: user.id });

        if (newTask) {
          toast.success('Task created successfully');
          onSuccess();
        } else {
          toast.error('Failed to create task');
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title*</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="What needs to be done?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Additional details about this task..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Task Type*</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CRMTask['type'] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskTypes.map(type => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority*</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as CRMTask['priority'] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  Low
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  High
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date*</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            required
          />
        </div>

        {task && (
          <div className="space-y-2">
            <Label htmlFor="status">Status*</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as CRMTask['status'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyId">Related Property</Label>
        <Select
          value={formData.propertyId || 'none'}
          onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value === 'none' ? '' : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {properties.map(property => (
              <SelectItem key={property.id} value={property.id}>
                {property.title || formatPropertyAddress(property.address) || 'Untitled Property'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};
