/**
 * TaskQuickAddWidget Component
 * 
 * Quick task addition widget for entity detail pages
 * Allows creating tasks directly from Property, Lead, Contact, Deal pages
 * 
 * DESIGN: Design System compliant
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { Task, TaskCategory, TaskEntityType } from '../../types/tasks';
import { createTask } from '../../lib/tasks';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Plus, Calendar as CalendarIcon, X, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaskQuickAddWidgetProps {
  user: User;
  entityType: TaskEntityType;
  entityId: string;
  entityName: string;
  onTaskCreated?: (task: Task) => void;
  suggestedCategory?: TaskCategory;
}

/**
 * TaskQuickAddWidget Component
 */
export const TaskQuickAddWidget: React.FC<TaskQuickAddWidgetProps> = ({
  user,
  entityType,
  entityId,
  entityName,
  onTaskCreated,
  suggestedCategory,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>(suggestedCategory || 'follow-up');
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  
  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    
    try {
      const task = createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority: 'medium',
        dueDate: dueDate.toISOString(),
        entityType,
        entityId,
        entityName,
        assignedTo: [user.id],
      }, user);
      
      toast.success('Task created successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory(suggestedCategory || 'follow-up');
      setDueDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setIsExpanded(false);
      
      if (onTaskCreated) {
        onTaskCreated(task);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };
  
  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setIsExpanded(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>
    );
  }
  
  return (
    <Card className="p-4 border-2 border-[#C17052]/30 bg-[#C17052]/5">
      <div className="space-y-3">
        {/* Title */}
        <Input
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        
        {/* Description */}
        <Textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        
        {/* Category and Due Date */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="viewing">Viewing</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="administrative">Administrative</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dueDate, 'MMM d')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(date) => date && setDueDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTitle('');
              setDescription('');
              setIsExpanded(false);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            <CheckSquare className="h-4 w-4 mr-1" />
            Create Task
          </Button>
        </div>
      </div>
    </Card>
  );
};
