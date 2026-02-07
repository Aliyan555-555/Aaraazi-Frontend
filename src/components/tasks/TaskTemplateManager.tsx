/**
 * TaskTemplateManager Component
 * 
 * Comprehensive task template management with:
 * - View all templates (system + custom)
 * - Create new templates
 * - Edit existing templates
 * - Delete custom templates
 * - Template usage statistics
 * - Quick template preview
 * - Duplicate templates
 * 
 * DESIGN: Design System V4.1 compliant
 * UX LAWS: Miller's Law (7±2 items per view), Fitts's Law (large touch targets)
 * 
 * @example
 * <TaskTemplateManager
 *   user={user}
 *   onClose={handleClose}
 *   onSelectTemplate={(templateId) => console.log(templateId)}
 * />
 */

import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { TaskTemplate, TaskPriority, TaskCategory } from '../../types/tasks';
import { getTaskTemplates } from '../../lib/tasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Plus,
  X,
  Edit2,
  Copy,
  Trash2,
  FileText,
  Clock,
  CheckSquare,
  Tag,
  TrendingUp,
  Star,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================== INTERFACES ====================

interface TaskTemplateManagerProps {
  user: User;
  onClose: () => void;
  onSelectTemplate?: (templateId: string) => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes?: number;
  checklist: Array<{ id: string; title: string; completed: boolean }>;
  tags: string[];
}

// ==================== CONSTANTS ====================

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

// ==================== HELPER FUNCTIONS ====================

/**
 * Get priority badge color
 */
function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
    case 'high': return 'bg-[#C17052]/10 text-[#C17052] border-[#C17052]/30';
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'low': return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

/**
 * Get category badge color
 */
function getCategoryColor(category: TaskCategory): string {
  const colors: Record<TaskCategory, string> = {
    'follow-up': 'bg-blue-50 text-blue-700 border-blue-200',
    'viewing': 'bg-purple-50 text-purple-700 border-purple-200',
    'documentation': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'negotiation': 'bg-pink-50 text-pink-700 border-pink-200',
    'inspection': 'bg-teal-50 text-teal-700 border-teal-200',
    'meeting': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'administrative': 'bg-gray-50 text-gray-700 border-gray-200',
    'marketing': 'bg-green-50 text-green-700 border-green-200',
    'financial': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'legal': 'bg-slate-50 text-slate-700 border-slate-200',
    'custom': 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return colors[category];
}

// ==================== TEMPLATE CARD COMPONENT ====================

interface TemplateCardProps {
  template: TaskTemplate;
  onSelect?: (templateId: string) => void;
  onEdit?: (template: TaskTemplate) => void;
  onDuplicate?: (template: TaskTemplate) => void;
  onDelete?: (templateId: string) => void;
  isSystemTemplate?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  isSystemTemplate = false,
}) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
            {isSystemTemplate && (
              <Badge variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                System
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={getPriorityColor(template.priority)}>
          {template.priority}
        </Badge>
        <Badge variant="outline" className={getCategoryColor(template.category)}>
          {template.category}
        </Badge>
        {template.estimatedMinutes && (
          <Badge variant="outline" className="text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            {template.estimatedMinutes} min
          </Badge>
        )}
      </div>

      {/* Checklist preview */}
      {template.checklist && template.checklist.length > 0 && (
        <div className="text-sm text-gray-600">
          <CheckSquare className="h-3 w-3 inline mr-1" />
          {template.checklist.length} checklist item{template.checklist.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Tags preview */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {template.usageCount || 0} uses
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {onSelect && (
          <Button
            size="sm"
            className="flex-1 bg-[#2D6A54] hover:bg-[#2D6A54]/90"
            onClick={() => onSelect(template.id)}
          >
            Use Template
          </Button>
        )}
        {onDuplicate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDuplicate(template)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        {!isSystemTemplate && onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(template)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {!isSystemTemplate && onDelete && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:border-red-300"
            onClick={() => onDelete(template.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

// ==================== CREATE/EDIT TEMPLATE FORM ====================

interface TemplateFormProps {
  template?: TaskTemplate;
  onSubmit: (data: TemplateFormData) => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'follow-up',
    priority: template?.priority || 'medium',
    estimatedMinutes: template?.estimatedMinutes,
    checklist: template?.checklist || [],
    tags: template?.tags || [],
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData(prev => ({
        ...prev,
        checklist: [
          ...prev.checklist,
          {
            id: `item_${Date.now()}`,
            title: newChecklistItem.trim(),
            completed: false,
          },
        ],
      }));
      setNewChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name *</Label>
        <Input
          id="template-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Follow-up Call"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="template-description">Description</Label>
        <Textarea
          id="template-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What is this template for?"
          rows={3}
        />
      </div>

      {/* Category & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="template-category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as TaskCategory }))}
          >
            <SelectTrigger id="template-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskPriority }))}
          >
            <SelectTrigger id="template-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="space-y-2">
        <Label htmlFor="template-time">Estimated Time (minutes)</Label>
        <Input
          id="template-time"
          type="number"
          value={formData.estimatedMinutes || ''}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            estimatedMinutes: e.target.value ? parseInt(e.target.value) : undefined 
          }))}
          placeholder="e.g., 30"
          min="1"
        />
      </div>

      <Separator />

      {/* Checklist */}
      <div className="space-y-2">
        <Label>Checklist Items</Label>
        <div className="flex gap-2">
          <Input
            value={newChecklistItem}
            onChange={(e) => setNewChecklistItem(e.target.value)}
            placeholder="Add checklist item"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddChecklistItem();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddChecklistItem}
            disabled={!newChecklistItem.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.checklist.length > 0 && (
          <div className="space-y-2 mt-2">
            {formData.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <CheckSquare className="h-4 w-4 text-gray-400" />
                <span className="flex-1 text-sm">{item.title}</span>
                <Button
                  type="button"
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
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag"
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
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
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

      {/* Actions */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#2D6A54] hover:bg-[#2D6A54]/90">
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// ==================== MAIN COMPONENT ====================

export const TaskTemplateManager: React.FC<TaskTemplateManagerProps> = ({
  user,
  onClose,
  onSelectTemplate,
}) => {
  // Load templates
  const allTemplates = getTaskTemplates();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'custom'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);

  // Separate system and custom templates
  const systemTemplates = allTemplates.filter(t => t.id.startsWith('template_'));
  const customTemplates = allTemplates.filter(t => !t.id.startsWith('template_'));

  // Filter templates based on search and tab
  const filteredTemplates = useMemo(() => {
    let templates = allTemplates;

    // Filter by tab
    if (activeTab === 'system') {
      templates = systemTemplates;
    } else if (activeTab === 'custom') {
      templates = customTemplates;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return templates;
  }, [allTemplates, systemTemplates, customTemplates, activeTab, searchQuery]);

  // Handlers
  const handleCreateTemplate = (data: TemplateFormData) => {
    // In real app, save to localStorage
    console.log('Create template:', data);
    toast.success('Template created successfully');
    setShowCreateForm(false);
  };

  const handleUpdateTemplate = (data: TemplateFormData) => {
    // In real app, update in localStorage
    console.log('Update template:', data);
    toast.success('Template updated successfully');
    setEditingTemplate(null);
  };

  const handleDuplicateTemplate = (template: TaskTemplate) => {
    // In real app, create duplicate in localStorage
    console.log('Duplicate template:', template);
    toast.success('Template duplicated successfully');
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      // In real app, delete from localStorage
      console.log('Delete template:', templateId);
      toast.success('Template deleted successfully');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2D6A54]" />
            Task Templates
          </DialogTitle>
          <DialogDescription>
            Create and manage reusable task templates for common workflows
          </DialogDescription>
        </DialogHeader>

        {/* Show create/edit form or template list */}
        {showCreateForm || editingTemplate ? (
          <TemplateForm
            template={editingTemplate || undefined}
            onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingTemplate(null);
            }}
          />
        ) : (
          <div className="space-y-4">
            {/* Search and Create */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#2D6A54] hover:bg-[#2D6A54]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All Templates ({allTemplates.length})
                </TabsTrigger>
                <TabsTrigger value="system">
                  System ({systemTemplates.length})
                </TabsTrigger>
                <TabsTrigger value="custom">
                  Custom ({customTemplates.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No templates found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={onSelectTemplate}
                        onEdit={(t) => setEditingTemplate(t)}
                        onDuplicate={handleDuplicateTemplate}
                        onDelete={handleDeleteTemplate}
                        isSystemTemplate={template.id.startsWith('template_')}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                {systemTemplates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No system templates found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {systemTemplates.filter(t =>
                      !searchQuery ||
                      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.description.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={onSelectTemplate}
                        onDuplicate={handleDuplicateTemplate}
                        isSystemTemplate={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                {customTemplates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No custom templates yet</p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customTemplates.filter(t =>
                      !searchQuery ||
                      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.description.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={onSelectTemplate}
                        onEdit={(t) => setEditingTemplate(t)}
                        onDuplicate={handleDuplicateTemplate}
                        onDelete={handleDeleteTemplate}
                        isSystemTemplate={false}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
