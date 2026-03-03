/**
 * CustomReportCard Component
 * 
 * Display card for saved custom report templates.
 * Shows template info and provides actions to run, edit, or delete.
 * 
 * Design System Compliant
 */

import React from 'react';
import { CustomReportTemplate } from '../../../../types/custom-reports';
import { Button } from '../../../ui/button';
import { 
  Play, 
  Edit2, 
  Trash2, 
  Calendar,
  Database,
  Filter,
  Layers,
  MoreVertical,
  BarChart3,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../ui/dropdown-menu';

interface CustomReportCardProps {
  template: CustomReportTemplate;
  onRun: (template: CustomReportTemplate) => void;
  onEdit: (template: CustomReportTemplate) => void;
  onDelete: (templateId: string) => void;
  onShare?: (template: CustomReportTemplate) => void;
}

export const CustomReportCard: React.FC<CustomReportCardProps> = ({
  template,
  onRun,
  onEdit,
  onDelete,
  onShare,
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-gray-900 mb-1">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Template
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(template.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Template
            </DropdownMenuItem>
            {onShare && (
              <DropdownMenuItem onClick={() => onShare(template)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Template
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Database className="h-4 w-4" />
          <span>{template.config.dataSources.length} source{template.config.dataSources.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>{template.config.filters?.length || 0} filter{(template.config.filters?.length || 0) !== 1 ? 's' : ''}</span>
        </div>
        {template.config.grouping && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Layers className="h-4 w-4" />
            <span>Grouped</span>
          </div>
        )}
        {template.config.chart?.enabled && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <BarChart3 className="h-4 w-4" />
            <span>With Chart</span>
          </div>
        )}
        {template.config.schedule?.enabled && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Calendar className="h-4 w-4" />
            <span>Scheduled</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Play className="h-4 w-4" />
          <span>{template.generationCount} run{template.generationCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-500 mb-4">
        Created {formatDate(template.createdAt)}
        {template.lastGenerated && (
          <> • Last run {formatDate(template.lastGenerated)}</>
        )}
      </div>

      {/* Run Button */}
      <Button 
        onClick={() => onRun(template)}
        className="w-full"
      >
        <Play className="h-4 w-4 mr-2" />
        Run Report
      </Button>
    </div>
  );
};