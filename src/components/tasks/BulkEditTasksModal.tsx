/**
 * BulkEditTasksModal Component
 * 
 * Comprehensive bulk editing modal for tasks with:
 * - Multi-field editing (status, priority, category, assignee, dates, tags)
 * - Smart change tracking (only update modified fields)
 * - Preview changes before applying
 * - Validation and error handling
 * - Partial update support (skip failed tasks)
 * 
 * DESIGN: Design System compliant
 * UX LAWS: Miller's Law (7±2 fields), Hick's Law (progressive disclosure)
 * 
 * @example
 * <BulkEditTasksModal
 *   open={true}
 *   onClose={handleClose}
 *   taskIds={selectedTaskIds}
 *   user={user}
 *   onTasksUpdated={handleRefresh}
 * />
 */

import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../types';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../types/tasks';
import { getTaskById, updateTask, getAllTasks } from '../../lib/tasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIcon,
  Users,
  Tag,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ==================== INTERFACES ====================

interface BulkEditTasksModalProps {
  open: boolean;
  onClose: () => void;
  taskIds: string[];
  user: User;
  onTasksUpdated: () => void;
}

/**
 * Fields that can be bulk edited
 */
interface BulkEditFields {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  assignedTo?: string[];
  dueDate?: string;
  tags?: string[];
}

/**
 * Track which fields are being edited
 */
interface FieldSelections {
  status: boolean;
  priority: boolean;
  category: boolean;
  assignedTo: boolean;
  dueDate: boolean;
  tags: boolean;
}

// ==================== CONSTANTS ====================

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'not-started', label: 'Not Started', color: 'text-gray-600' },
  { value: 'in-progress', label: 'In Progress', color: 'text-blue-600' },
  { value: 'waiting', label: 'Waiting', color: 'text-yellow-600' },
  { value: 'completed', label: 'Completed', color: 'text-green-600' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'low', label: 'Low', color: 'text-green-600' },
];

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'viewing', label: 'Viewing' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'financial', label: 'Financial' },
  { value: 'legal', label: 'Legal' },
  { value: 'custom', label: 'Custom' },
];

// ==================== MAIN COMPONENT ====================

export const BulkEditTasksModal: React.FC<BulkEditTasksModalProps> = ({
  open,
  onClose,
  taskIds,
  user,
  onTasksUpdated,
}) => {
  // Field selections (which fields to update)
  const [fieldSelections, setFieldSelections] = useState<FieldSelections>({
    status: false,
    priority: false,
    category: false,
    assignedTo: false,
    dueDate: false,
    tags: false,
  });

  // Edited values
  const [editedFields, setEditedFields] = useState<BulkEditFields>({});
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Get all agents for assignment
  const allUsers = useMemo(() => {
    // In a real app, fetch from user service
    // For now, return current user
    return [user];
  }, [user]);

  // Load tasks to preview changes
  const tasks = useMemo(() => {
    return taskIds.map(id => getTaskById(id)).filter(Boolean) as Task[];
  }, [taskIds]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFieldSelections({
        status: false,
        priority: false,
        category: false,
        assignedTo: false,
        dueDate: false,
        tags: false,
      });
      setEditedFields({});
      setShowPreview(false);
    }
  }, [open]);

  // ==================== HANDLERS ====================

  const toggleFieldSelection = (field: keyof FieldSelections) => {
    setFieldSelections(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleStatusChange = (value: string) => {
    setEditedFields(prev => ({ ...prev, status: value as TaskStatus }));
  };

  const handlePriorityChange = (value: string) => {
    setEditedFields(prev => ({ ...prev, priority: value as TaskPriority }));
  };

  const handleCategoryChange = (value: string) => {
    setEditedFields(prev => ({ ...prev, category: value as TaskCategory }));
  };

  const handleDueDateChange = (date: Date | undefined) => {
    if (date) {
      setEditedFields(prev => ({ ...prev, dueDate: date.toISOString() }));
    }
    setDueDateOpen(false);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = editedFields.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        setEditedFields(prev => ({
          ...prev,
          tags: [...currentTags, newTag.trim()],
        }));
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedFields(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove),
    }));
  };

  const handleAssigneeToggle = (userId: string) => {
    const currentAssignees = editedFields.assignedTo || [];
    if (currentAssignees.includes(userId)) {
      setEditedFields(prev => ({
        ...prev,
        assignedTo: currentAssignees.filter(id => id !== userId),
      }));
    } else {
      setEditedFields(prev => ({
        ...prev,
        assignedTo: [...currentAssignees, userId],
      }));
    }
  };

  // ==================== VALIDATION ====================

  const hasSelectedFields = Object.values(fieldSelections).some(Boolean);
  
  const hasValidValues = useMemo(() => {
    // Check if all selected fields have values
    if (fieldSelections.status && !editedFields.status) return false;
    if (fieldSelections.priority && !editedFields.priority) return false;
    if (fieldSelections.category && !editedFields.category) return false;
    if (fieldSelections.assignedTo && (!editedFields.assignedTo || editedFields.assignedTo.length === 0)) return false;
    if (fieldSelections.dueDate && !editedFields.dueDate) return false;
    if (fieldSelections.tags && (!editedFields.tags || editedFields.tags.length === 0)) return false;
    return true;
  }, [fieldSelections, editedFields]);

  const canSubmit = hasSelectedFields && hasValidValues && !isSubmitting;

  // ==================== SUBMIT ====================

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      // Build update object with only selected fields
      const updates: Partial<Task> = {};
      
      if (fieldSelections.status && editedFields.status) {
        updates.status = editedFields.status;
      }
      if (fieldSelections.priority && editedFields.priority) {
        updates.priority = editedFields.priority;
      }
      if (fieldSelections.category && editedFields.category) {
        updates.category = editedFields.category;
      }
      if (fieldSelections.assignedTo && editedFields.assignedTo) {
        updates.assignedTo = editedFields.assignedTo;
      }
      if (fieldSelections.dueDate && editedFields.dueDate) {
        updates.dueDate = editedFields.dueDate;
      }
      if (fieldSelections.tags && editedFields.tags) {
        updates.tags = editedFields.tags;
      }

      // Update all tasks
      let successCount = 0;
      let failCount = 0;

      for (const taskId of taskIds) {
        try {
          updateTask(taskId, updates, user);
          successCount++;
        } catch (error) {
          console.error(`Failed to update task ${taskId}:`, error);
          failCount++;
        }
      }

      // Show result
      if (failCount === 0) {
        toast.success(`Successfully updated ${successCount} task${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.warning(`Updated ${successCount} task${successCount > 1 ? 's' : ''}, ${failCount} failed`);
      } else {
        toast.error('Failed to update tasks');
      }

      // Refresh and close
      onTasksUpdated();
      onClose();
    } catch (error) {
      console.error('Bulk edit error:', error);
      toast.error('Failed to update tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#2D6A54]" />
            Bulk Edit Tasks
          </DialogTitle>
          <DialogDescription>
            Edit {taskIds.length} selected task{taskIds.length > 1 ? 's' : ''}. Only fields you select will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Alert */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Select fields to edit
              </p>
              <p className="text-sm text-blue-700">
                Check the boxes next to fields you want to update. Only selected fields will be changed.
              </p>
            </div>
          </div>

          {/* Field Editors */}
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="edit-status"
                checked={fieldSelections.status}
                onCheckedChange={() => toggleFieldSelection('status')}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="edit-status" className="cursor-pointer">
                  Status
                </Label>
                {fieldSelections.status && (
                  <Select value={editedFields.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className={option.color}>{option.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Separator />

            {/* Priority */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="edit-priority"
                checked={fieldSelections.priority}
                onCheckedChange={() => toggleFieldSelection('priority')}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="edit-priority" className="cursor-pointer">
                  Priority
                </Label>
                {fieldSelections.priority && (
                  <Select value={editedFields.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className={option.color}>{option.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Separator />

            {/* Category */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="edit-category"
                checked={fieldSelections.category}
                onCheckedChange={() => toggleFieldSelection('category')}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="edit-category" className="cursor-pointer">
                  Category
                </Label>
                {fieldSelections.category && (
                  <Select value={editedFields.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Separator />

            {/* Due Date */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="edit-dueDate"
                checked={fieldSelections.dueDate}
                onCheckedChange={() => toggleFieldSelection('dueDate')}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="edit-dueDate" className="cursor-pointer">
                  Due Date
                </Label>
                {fieldSelections.dueDate && (
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedFields.dueDate
                          ? format(new Date(editedFields.dueDate), 'PPP')
                          : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editedFields.dueDate ? new Date(editedFields.dueDate) : undefined}
                        onSelect={handleDueDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="edit-tags"
                checked={fieldSelections.tags}
                onCheckedChange={() => toggleFieldSelection('tags')}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="edit-tags" className="cursor-pointer">
                  Tags
                </Label>
                {fieldSelections.tags && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    {editedFields.tags && editedFields.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editedFields.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
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
                )}
              </div>
            </div>

            <Separator />

            {/* Assignees */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="edit-assignedTo"
                checked={fieldSelections.assignedTo}
                onCheckedChange={() => toggleFieldSelection('assignedTo')}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="edit-assignedTo" className="cursor-pointer">
                  Assign To
                </Label>
                {fieldSelections.assignedTo && (
                  <div className="space-y-2">
                    {allUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`user-${u.id}`}
                          checked={editedFields.assignedTo?.includes(u.id) || false}
                          onCheckedChange={() => handleAssigneeToggle(u.id)}
                        />
                        <Label htmlFor={`user-${u.id}`} className="cursor-pointer">
                          {u.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Summary */}
          {hasSelectedFields && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900">
                  Ready to update {taskIds.length} task{taskIds.length > 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-sm text-green-700 ml-7">
                {Object.keys(fieldSelections).filter(key => fieldSelections[key as keyof FieldSelections]).length} field
                {Object.keys(fieldSelections).filter(key => fieldSelections[key as keyof FieldSelections]).length > 1 ? 's' : ''} will be updated
              </p>
            </div>
          )}

          {/* Validation Warning */}
          {hasSelectedFields && !hasValidValues && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Please provide values for all selected fields before saving.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#2D6A54] hover:bg-[#2D6A54]/90"
          >
            {isSubmitting ? (
              <>Updating...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update {taskIds.length} Task{taskIds.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
