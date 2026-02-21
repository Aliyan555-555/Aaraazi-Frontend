import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { FileText, Download } from 'lucide-react';

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  dateFrom: string;
  dateTo: string;
  format: 'pdf' | 'csv' | 'excel';
  includeComparison: boolean;
  comparisonPeriod?: 'previous-period' | 'previous-year';
  generatedAt: string;
  generatedBy: string;
}

interface GenerateReportModalProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  onGenerate: (report: Omit<GeneratedReport, 'id' | 'generatedAt'>) => void;
  userName: string;
}

/**
 * GenerateReportModal Component
 * 
 * Modal for configuring and generating financial reports.
 * 
 * Design System Compliant:
 * - Uses Shadcn Dialog, Input, Select components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Jakob's Law: Standard report configuration form
 * - Hick's Law: Clear grouped options
 * - Fitts's Law: Large input fields and buttons
 * 
 * Features:
 * - Date range selection
 * - Format selection (PDF/CSV/Excel)
 * - Comparison options (YoY, MoM)
 * - Instant generation
 * - Export on completion
 * 
 * @example
 * <GenerateReportModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   templateId="profit-loss"
 *   templateName="Profit & Loss Statement"
 *   onGenerate={handleGenerate}
 *   userName={user.name}
 * />
 */
export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  open,
  onClose,
  templateId,
  templateName,
  onGenerate,
  userName,
}) => {
  // Default to current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [includeComparison, setIncludeComparison] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous-period' | 'previous-year'>('previous-period');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      alert('Please select a date range');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      alert('Start date must be before end date');
      return;
    }

    setIsGenerating(true);

    try {
      const reportData: Omit<GeneratedReport, 'id' | 'generatedAt'> = {
        templateId,
        templateName,
        dateFrom,
        dateTo,
        format,
        includeComparison,
        comparisonPeriod: includeComparison ? comparisonPeriod : undefined,
        generatedBy: userName,
      };

      await onGenerate(reportData);
      onClose();
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate {templateName}</DialogTitle>
          <DialogDescription>
            Configure the report parameters and choose your export format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date *</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date *</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Quick Date Ranges */}
          <div>
            <Label>Quick Select</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                  setDateFrom(firstDay);
                  setDateTo(lastDay);
                }}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                  setDateFrom(firstDay);
                  setDateTo(lastDay);
                }}
              >
                Last Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                  const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
                  setDateFrom(firstDay);
                  setDateTo(lastDay);
                }}
              >
                This Year
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                  const lastDay = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
                  setDateFrom(firstDay);
                  setDateTo(lastDay);
                }}
              >
                Last Year
              </Button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <Label htmlFor="format">Export Format *</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'csv' | 'excel')}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                <SelectItem value="excel">Excel Workbook (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comparison Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeComparison"
                checked={includeComparison}
                onCheckedChange={(checked) => setIncludeComparison(checked as boolean)}
              />
              <Label htmlFor="includeComparison" className="cursor-pointer">
                Include comparison with previous period
              </Label>
            </div>

            {includeComparison && (
              <div className="ml-6">
                <Select value={comparisonPeriod} onValueChange={(v) => setComparisonPeriod(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous-period">Compare with Previous Period (MoM)</SelectItem>
                    <SelectItem value="previous-year">Compare with Previous Year (YoY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Preview Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-900 mb-1">Report Preview</p>
                <p className="text-blue-700 text-sm">
                  {templateName} • {new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to{' '}
                  {new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {includeComparison && ` • With ${comparisonPeriod === 'previous-year' ? 'YoY' : 'MoM'} comparison`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate & Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
