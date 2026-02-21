/**
 * ReportBuilderModal Component
 * 
 * Multi-step wizard for building custom reports.
 * Allows users to select data sources, fields, filters, grouping, and preview results.
 * 
 * Features:
 * - 5-step progressive disclosure
 * - Real-time validation
 * - Live preview
 * - Save custom templates
 * 
 * Design System Compliant:
 * - Uses Shadcn Dialog
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * @example
 * <ReportBuilderModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSave={(template) => console.log('Saved:', template)}
 *   user={currentUser}
 * />
 */

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';
import { 
  CustomReportTemplate, 
  ReportConfiguration,
  DataSource,
  SelectedField,
  FilterRule,
  GroupingConfig
} from '../../../../types/custom-reports';
import { User } from '../../../../types';
import { 
  saveCustomReport, 
  validateReportConfig,
  generateReport 
} from '../../../../lib/custom-report-builder';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Save,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Step components (will implement these)
import { DataSourceStep } from './DataSourceStep';
import { FieldSelectorStep } from './FieldSelectorStep';
import { FilterConfiguratorStep } from './FilterConfiguratorStep';
import { GroupingConfiguratorStep } from './GroupingConfiguratorStep';
import { ChartConfiguratorStep } from './ChartConfiguratorStep';
import { ScheduleConfiguratorStep } from './ScheduleConfiguratorStep';
import { PreviewStep } from './PreviewStep';

interface ReportBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: CustomReportTemplate) => void;
  user: User;
  editTemplate?: CustomReportTemplate; // For editing existing templates
}

/**
 * ReportBuilderModal Component
 */
export const ReportBuilderModal: React.FC<ReportBuilderModalProps> = ({
  open,
  onClose,
  onSave,
  user,
  editTemplate,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [reportName, setReportName] = useState(editTemplate?.name || '');
  const [reportDescription, setReportDescription] = useState(editTemplate?.description || '');
  
  const [config, setConfig] = useState<Partial<ReportConfiguration>>({
    dataSources: editTemplate?.config.dataSources || [],
    fields: editTemplate?.config.fields || [],
    filters: editTemplate?.config.filters || [],
    grouping: editTemplate?.config.grouping,
    sorting: editTemplate?.config.sorting || [],
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Step configuration
  const steps = [
    { number: 1, title: 'Data Sources', component: DataSourceStep },
    { number: 2, title: 'Select Fields', component: FieldSelectorStep },
    { number: 3, title: 'Add Filters', component: FilterConfiguratorStep },
    { number: 4, title: 'Grouping', component: GroupingConfiguratorStep },
    { number: 5, title: 'Chart', component: ChartConfiguratorStep },
    { number: 6, title: 'Schedule', component: ScheduleConfiguratorStep },
    { number: 7, title: 'Preview & Save', component: PreviewStep },
  ];

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return config.dataSources && config.dataSources.length > 0;
      case 2:
        return config.fields && config.fields.length > 0;
      case 3:
        return true; // Filters are optional
      case 4:
        return true; // Grouping is optional
      case 5:
        return true; // Chart is optional
      case 6:
        return true; // Schedule is optional
      case 7:
        return reportName.trim().length > 0;
      default:
        return false;
    }
  }, [currentStep, config, reportName]);

  // Handlers
  const handleNext = () => {
    if (canProceed && currentStep < 7) {
      setCurrentStep(currentStep + 1);
      setErrors([]);
    } else {
      // Show validation errors
      const validation = validateReportConfig(config);
      if (!validation.isValid) {
        setErrors(validation.errors);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors([]);
    }
  };

  const handleConfigChange = (updates: Partial<ReportConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    // Final validation
    const validation = validateReportConfig(config);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix validation errors');
      return;
    }

    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    // Create template
    const template: CustomReportTemplate = {
      id: editTemplate?.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: reportName,
      description: reportDescription,
      createdBy: user.id,
      createdAt: editTemplate?.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isShared: false,
      config: config as ReportConfiguration,
      generationCount: editTemplate?.generationCount || 0,
      lastGenerated: editTemplate?.lastGenerated,
    };

    try {
      saveCustomReport(template);
      toast.success(`Report template "${reportName}" saved successfully!`);
      onSave(template);
      handleClose();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report template');
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setReportName('');
    setReportDescription('');
    setConfig({
      dataSources: [],
      fields: [],
      filters: [],
      sorting: [],
    });
    setErrors([]);
    onClose();
  };

  // Current step component
  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {editTemplate ? 'Edit' : 'Create'} Custom Report - Step {currentStep} of 7
            </span>
            <span className="text-muted-foreground">
              {steps[currentStep - 1].title}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Step Progress Indicator */}
        <div className="flex items-center gap-2 py-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div
                className={`flex-1 h-2 rounded transition-colors ${
                  step.number < currentStep
                    ? 'bg-green-600'
                    : step.number === currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              />
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center w-6 h-6">
                  {step.number < currentStep ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-gray-400">{step.number + 1}</span>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-900 mb-2">Please fix the following errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {currentStep === 7 ? (
            <div className="space-y-6">
              {/* Report Name and Description */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName">
                    Report Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g., Agent Performance Q1 2026"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportDescription">Description (Optional)</Label>
                  <Textarea
                    id="reportDescription"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Brief description of what this report shows..."
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Preview */}
              <CurrentStepComponent
                config={config}
                onChange={handleConfigChange}
                user={user}
              />
            </div>
          ) : (
            <CurrentStepComponent
              config={config}
              onChange={handleConfigChange}
              user={user}
            />
          )}
        </div>

        {/* Navigation Footer */}
        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 7 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!canProceed}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {editTemplate ? 'Update' : 'Save'} Template
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};