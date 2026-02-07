/**
 * RunReportModal Component
 * 
 * Modal for running a report with parameter customization
 * Allows users to override date ranges and filters before generation
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Play, X, Calendar, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ReportTemplate, DateRangePreset, GeneratedReport } from '../../types/reports';
import { generateReport } from '../../lib/reports';
import { getCurrentUser } from '../../lib/auth';
import { toast } from 'sonner';
import ReportViewer from './ReportViewer';

interface RunReportModalProps {
  template: ReportTemplate;
  onClose: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

export default function RunReportModal({ template, onClose, onNavigate }: RunReportModalProps) {
  const user = getCurrentUser();

  const [dateRange, setDateRange] = useState<DateRangePreset>(
    template.config.dateRange.preset || 'this-month'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  // Handle run report
  const handleRun = async () => {
    if (!user) {
      toast.error('User not authenticated. Please log in and try again.');
      return;
    }

    setIsGenerating(true);

    try {
      // Update template with selected date range
      const updatedTemplate = {
        ...template,
        config: {
          ...template.config,
          dateRange: {
            ...template.config.dateRange,
            preset: dateRange,
          },
        },
      };

      // Generate report
      const report = generateReport(updatedTemplate.id, user.id, user.name);

      if (report) {
        setGeneratedReport(report);
        toast.success('Report generated successfully');
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle regenerate
  const handleRegenerate = () => {
    setGeneratedReport(null);
    handleRun();
  };

  // If report is generated, show viewer
  if (generatedReport) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <ReportViewer
          report={generatedReport}
          onClose={onClose}
          onRegenerate={handleRegenerate}
        />
        <div className="fixed top-4 right-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Otherwise, show run configuration
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-heading)' }}>
              Run Report
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {template.name}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report Description */}
          {template.description && (
            <div>
              <p style={{ color: 'var(--color-text)' }}>
                {template.description}
              </p>
            </div>
          )}

          {/* Date Range Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangePreset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="qtd">Quarter to Date</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                <SelectItem value="last-12-months">Last 12 Months</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Configuration Summary */}
          <div className="space-y-3">
            <div className="text-sm font-medium" style={{ color: 'var(--color-heading)' }}>
              Report Configuration
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div style={{ color: 'var(--color-text-muted)' }}>Data Sources</div>
                <div style={{ color: 'var(--color-text)' }}>
                  {template.config.dataSources.length} module(s)
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)' }}>Filters</div>
                <div style={{ color: 'var(--color-text)' }}>
                  {template.config.filters.length} filter(s)
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)' }}>Dimensions</div>
                <div style={{ color: 'var(--color-text)' }}>
                  {template.config.dimensions?.length || 0} dimension(s)
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)' }}>Metrics</div>
                <div style={{ color: 'var(--color-text)' }}>
                  {template.config.metrics.length} metric(s)
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <Card className="p-4" style={{ backgroundColor: 'var(--color-accent)' }}>
            <div className="flex gap-3">
              <Filter className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
              <div className="text-sm" style={{ color: 'var(--color-text)' }}>
                <div className="font-medium mb-1">Quick Tip</div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                  You can customize the date range for this run. The template configuration will remain unchanged.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleRun} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Report
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}