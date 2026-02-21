/**
 * CreateTaskModal Component
 * 
 * Smart task creation with:
 * - Task templates
 * - Recurrence patterns
 * - Intelligent suggestions
 * - Entity linking
 * - Checklist builder
 * - Time estimation
 * 
 * DESIGN: Design System compliant
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { Task, TaskTemplate, TaskPriority, TaskCategory, TaskEntityType, RecurrencePattern } from '../../types/tasks';
import { createTask, createTaskFromTemplate, getTaskTemplates } from '../../lib/tasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  FileText,
  Repeat,
  Link2,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onTaskCreated: (task: Task) => void;
  
  // Pre-fill options
  entityType?: TaskEntityType;
  entityId?: string;
  entityName?: string;
  suggestedTitle?: string;
  suggestedCategory?: TaskCategory;
}

/**
 * CreateTaskModal Component
 */
export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  open,
  onClose,
  user,
  onTaskCreated,
  entityType,
  entityId,
  entityName,
  suggestedTitle,
  suggestedCategory,
}) => {
  // Form mode
  const [mode, setMode] = useState<'blank' | 'template'>('blank');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Basic fields
  const [title, setTitle] = useState(suggestedTitle || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>(suggestedCategory || 'follow-up');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  
  // Dates
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  
  // Assignment
  const [assignedTo, setAssignedTo] = useState<string[]>([user.id]);
  
  // Time estimation
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(0);
  
  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);
  
  // Checklist
  const [checklist, setChecklist] = useState<{ id: string; title: string }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Entity linking
  const [linkedEntityType, setLinkedEntityType] = useState<TaskEntityType | undefined>(entityType);
  const [linkedEntityId, setLinkedEntityId] = useState<string | undefined>(entityId);
  const [linkedEntityName, setLinkedEntityName] = useState<string | undefined>(entityName);
  
  // Load templates
  const templates = getTaskTemplates();
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      setTitle(template.name);
      setDescription(template.description);
      setCategory(template.category);
      setPriority(template.priority);
      setEstimatedHours(Math.floor((template.estimatedMinutes || 0) / 60));
      setEstimatedMinutes((template.estimatedMinutes || 0) % 60);
      setChecklist(template.checklist.map((item, idx) => ({
        id: `checklist_${idx}`,
        title: item.title,
      })));
      setTags(template.tags);
    }
  };
  
  // Add checklist item
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    setChecklist([...checklist, {
      id: `checklist_${Date.now()}`,
      title: newChecklistItem,
    }]);
    setNewChecklistItem('');
  };
  
  // Remove checklist item
  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };
  
  // Add tag
  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    
    setTags([...tags, newTag.trim()]);
    setNewTag('');
  };
  
  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  // Handle submit
  const handleSubmit = () => {
    // Validation
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    
    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }
    
    try {
      // Calculate total estimated minutes
      const totalEstimatedMinutes = (estimatedHours * 60) + estimatedMinutes;
      
      // Create task
      const task = createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate.toISOString(),
        startDate: startDate?.toISOString(),
        assignedTo,
        estimatedMinutes: totalEstimatedMinutes > 0 ? totalEstimatedMinutes : undefined,
        isRecurring,
        recurrenceConfig: isRecurring ? {
          pattern: recurrencePattern,
          interval: recurrenceInterval,
          endDate: recurrenceEndDate?.toISOString(),
        } : undefined,
        checklist: checklist.map(item => ({
          id: item.id,
          title: item.title,
          completed: false,
        })),
        tags,
        entityType: linkedEntityType,
        entityId: linkedEntityId,
        entityName: linkedEntityName,
      }, user);
      
      toast.success('Task created successfully');
      onTaskCreated(task);
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };
  
  // Handle close
  const handleClose = () => {
    // Reset form
    setMode('blank');
    setSelectedTemplate('');
    setTitle(suggestedTitle || '');
    setDescription('');
    setCategory(suggestedCategory || 'follow-up');
    setPriority('medium');
    setDueDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setStartDate(undefined);
    setAssignedTo([user.id]);
    setEstimatedHours(0);
    setEstimatedMinutes(0);
    setIsRecurring(false);
    setRecurrencePattern('weekly');
    setRecurrenceInterval(1);
    setRecurrenceEndDate(undefined);
    setChecklist([]);
    setNewChecklistItem('');
    setTags([]);
    setNewTag('');
    setLinkedEntityType(entityType);
    setLinkedEntityId(entityId);
    setLinkedEntityName(entityName);
    
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#1A1D1F]">Create New Task</DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Create a task from scratch or use a template
          </DialogDescription>
        </DialogHeader>
        
        {/* Mode Selector */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'blank' | 'template')} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blank">Blank Task</TabsTrigger>
            <TabsTrigger value="template">From Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="template" className="space-y-4">
            {/* Template Selection */}
            <div className="grid grid-cols-1 gap-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-[#C17052] bg-[#C17052]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#1A1D1F] mb-1">{template.name}</h4>
                      <p className="text-sm text-[#6B7280] mb-2">{template.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">{template.category}</Badge>
                        <Badge variant="outline" size="sm">{template.priority}</Badge>
                        {template.estimatedMinutes && (
                          <Badge variant="outline" size="sm">
                            <Clock className="h-3 w-3 mr-1" />
                            {Math.floor(template.estimatedMinutes / 60)}h {template.estimatedMinutes % 60}m
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      Used {template.usageCount} times
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#1A1D1F]">Basic Information</h3>
            
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Follow up with client about viewing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add more details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                  <SelectTrigger id="category">
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">⚪ Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Dates and Time */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#1A1D1F]">Dates & Time Estimation</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="space-y-2">
                <Label>
                  Due Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dueDate ? format(dueDate, 'PPP') : 'Select date'}
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
              
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {startDate ? format(startDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Time Estimation */}
            <div className="space-y-2">
              <Label>Estimated Time</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Hours"
                    value={estimatedHours || ''}
                    onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-[#6B7280]">hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Mins"
                    value={estimatedMinutes || ''}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-[#6B7280]">minutes</span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Recurrence */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="recurring" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Make this a recurring task
                </div>
              </Label>
            </div>
            
            {isRecurring && (
              <div className="pl-6 space-y-4 border-l-2 border-[#C17052]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pattern</Label>
                    <Select value={recurrencePattern} onValueChange={(v) => setRecurrencePattern(v as RecurrencePattern)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Every</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-[#6B7280]">
                        {recurrencePattern === 'daily' ? 'days' : 
                         recurrencePattern === 'weekly' ? 'weeks' : 
                         recurrencePattern === 'biweekly' ? 'periods' : 
                         recurrencePattern === 'monthly' ? 'months' : 
                         recurrencePattern === 'quarterly' ? 'quarters' : 'years'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {recurrenceEndDate ? format(recurrenceEndDate, 'PPP') : 'Never ends'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        onSelect={(date) => setRecurrenceEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#1A1D1F]">Checklist</h3>
              <Badge variant="outline">{checklist.length} items</Badge>
            </div>
            
            {/* Add Checklist Item */}
            <div className="flex gap-2">
              <Input
                placeholder="Add checklist item..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
              />
              <Button onClick={handleAddChecklistItem} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Checklist Items */}
            {checklist.length > 0 && (
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200">
                    <CheckSquare className="h-4 w-4 text-[#6B7280]" />
                    <span className="flex-1 text-[#1A1D1F]">{item.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#1A1D1F]">Tags</h3>
              <Badge variant="outline">{tags.length} tags</Badge>
            </div>
            
            {/* Add Tag */}
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Tags List */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Entity Link */}
          {linkedEntityType && linkedEntityId && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium text-[#1A1D1F]">Linked To</h3>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <Link2 className="h-4 w-4 text-[#6B7280]" />
                  <span className="font-medium text-[#1A1D1F]">
                    {linkedEntityType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}:
                  </span>
                  <span className="text-[#363F47]">{linkedEntityName}</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
