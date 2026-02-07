import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TimelineEvent {
  id: string;
  projectId: string;
  type: 'milestone' | 'phase' | 'task' | 'inspection' | 'payment' | 'delivery';
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  dependencies: string[];
  tags: string[];
  budget: number;
  actualCost: number;
  attachments: string[];
  notes: string;
  color?: string;
  isEditable: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimelineEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  projectId: string;
  editingEvent?: TimelineEvent | null;
  existingEvents: TimelineEvent[];
}

export const TimelineEventForm: React.FC<TimelineEventFormProps> = ({
  isOpen,
  onClose,
  onSave,
  projectId,
  editingEvent,
  existingEvents
}) => {
  const [formData, setFormData] = useState({
    type: editingEvent?.type || 'task',
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    startDate: editingEvent?.startDate || format(new Date(), 'yyyy-MM-dd'),
    endDate: editingEvent?.endDate || format(new Date(), 'yyyy-MM-dd'),
    progress: editingEvent?.progress || 0,
    status: editingEvent?.status || 'pending',
    priority: editingEvent?.priority || 'medium',
    assignedTo: editingEvent?.assignedTo || '',
    budget: editingEvent?.budget || 0,
    actualCost: editingEvent?.actualCost || 0,
    notes: editingEvent?.notes || '',
    color: editingEvent?.color || '#3B82F6',
    dependencies: editingEvent?.dependencies || [],
    tags: editingEvent?.tags || []
  });

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    const eventData: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      projectId,
      type: formData.type as TimelineEvent['type'],
      title: formData.title.trim(),
      description: formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      progress: formData.progress,
      status: formData.status as TimelineEvent['status'],
      priority: formData.priority as TimelineEvent['priority'],
      assignedTo: formData.assignedTo || undefined,
      dependencies: formData.dependencies,
      tags: formData.tags,
      budget: formData.budget,
      actualCost: formData.actualCost,
      attachments: [],
      notes: formData.notes,
      color: formData.color,
      isEditable: true,
      parentId: undefined
    };

    onSave(eventData);
    onClose();
    toast.success(`Timeline event ${editingEvent ? 'updated' : 'created'} successfully`);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? 'Edit Timeline Event' : 'Add Timeline Event'}
          </DialogTitle>
          <DialogDescription>
            {editingEvent ? 'Update the timeline event details' : 'Create a new timeline event for this project'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="phase">Phase</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter event title"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter event description"
              rows={3}
              className="w-full"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(new Date(formData.startDate), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate ? new Date(formData.startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
                        setStartDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(new Date(formData.endDate), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate ? new Date(formData.endDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }));
                        setEndDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status and Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                placeholder="0-100"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (PKR)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualCost">Actual Cost (PKR)</Label>
              <Input
                id="actualCost"
                type="number"
                min="0"
                value={formData.actualCost}
                onChange={(e) => setFormData(prev => ({ ...prev, actualCost: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  <span>{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(tag)}
                    className="h-auto p-0 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {editingEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};