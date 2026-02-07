import React from 'react';
import { Button } from '../../ui/button';
import { LucideIcon, Star, StarOff, FileText, Download } from 'lucide-react';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: 'financial' | 'operational' | 'custom';
  isFavorite?: boolean;
  lastGenerated?: string;
  generatedCount: number;
}

interface ReportTemplateCardProps {
  template: ReportTemplate;
  onGenerate: (templateId: string) => void;
  onToggleFavorite?: (templateId: string) => void;
  onViewHistory?: (templateId: string) => void;
}

/**
 * ReportTemplateCard Component
 * 
 * Card displaying a report template with quick actions.
 * 
 * Design System V4.1 Compliant:
 * - Uses Shadcn Button components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * - Uses rounded-lg for corners
 * 
 * UX Laws Applied:
 * - Fitts's Law: Large clickable area, big "Generate" button
 * - Aesthetic-Usability: Clean card design with hover states
 * - Jakob's Law: Familiar card layout pattern
 * 
 * Features:
 * - Report icon and name
 * - Description
 * - Favorite toggle
 * - Generate button (primary action)
 * - Last generated date
 * - Generation count
 * - View history link
 * 
 * @example
 * <ReportTemplateCard
 *   template={profitLossTemplate}
 *   onGenerate={(id) => generateReport(id)}
 *   onToggleFavorite={(id) => toggleFav(id)}
 * />
 */
export const ReportTemplateCard: React.FC<ReportTemplateCardProps> = ({
  template,
  onGenerate,
  onToggleFavorite,
  onViewHistory,
}) => {
  const Icon = template.icon;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'financial': 'bg-blue-100 text-blue-700',
      'operational': 'bg-green-100 text-green-700',
      'custom': 'bg-purple-100 text-purple-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white hover:shadow-lg transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gray-50">
              <Icon className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h3 className="text-gray-900 mb-1">{template.name}</h3>
              <span className={`px-2 py-1 rounded text-sm ${getCategoryColor(template.category)}`}>
                {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
              </span>
            </div>
          </div>
          
          {/* Favorite Toggle */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(template.id);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {template.isFavorite ? (
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-5 w-5 text-gray-400" />
              )}
            </button>
          )}
        </div>

        <p className="text-gray-600">{template.description}</p>
      </div>

      {/* Card Body - Stats */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-500 text-sm mb-1">Last Generated</p>
            <p className="text-gray-900">
              {template.lastGenerated
                ? new Date(template.lastGenerated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Times Generated</p>
            <p className="text-gray-900">{template.generatedCount}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onGenerate(template.id)}
            className="flex-1"
            size="lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          
          {onViewHistory && template.generatedCount > 0 && (
            <Button
              variant="outline"
              onClick={() => onViewHistory(template.id)}
              size="lg"
            >
              History
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
