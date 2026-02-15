/**
 * ReportBuilder Component
 * 
 * Multi-step wizard for creating custom reports
 * Allows users to select data sources, apply filters, configure dimensions/metrics, and preview
 * 
 * STEPS:
 * 1. Basic Info & Data Source
 * 2. Date Range & Filters
 * 3. Dimensions & Grouping
 * 4. Metrics & Calculations
 * 5. Chart Configuration
 * 6. Preview & Save
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  BarChart3,
  Eye,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ReportTemplate,
  ReportConfig,
  ReportModule,
  ReportCategory,
  DateRangePreset,
  ReportFilter,
  ReportDimension,
  ReportMetric,
  FilterOperator,
  AggregationType
} from '../../types/reports';
import { toast } from 'sonner';
// [STUBBED] import { saveReportTemplate } from '../../lib/reports';
import { getCurrentUser } from '../../lib/auth';
import { getFieldsForModule, AGING_BUCKETS, PAYMENT_STATUS_OPTIONS, CONFIDENCE_LEVEL_OPTIONS } from '../../lib/reportFieldConfig';
import { SYSTEM_REPORTS } from '../../types/reports';

// ===== STUBS for removed prototype functions =====
const saveReportTemplate = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface ReportBuilderProps {
  onClose: () => void;
  onSave?: (template: ReportTemplate) => void;
}

export default function ReportBuilder({ onClose, onSave }: ReportBuilderProps) {
  const user = getCurrentUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('custom');
  const [selectedModules, setSelectedModules] = useState<ReportModule[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this-month');
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [dimensions, setDimensions] = useState<ReportDimension[]>([]);
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Chart configuration
  const [enableCharts, setEnableCharts] = useState(true);
  const [defaultChartType, setDefaultChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [chartColors, setChartColors] = useState<string[]>([
    '#C17052', // terracotta
    '#2D6A54', // forest green
    '#E8E2D5', // cream
    '#363F47', // slate
    '#8B4513', // brown
    '#4682B4', // steel blue
    '#9370DB', // purple
    '#20B2AA'  // light sea green
  ]);

  const totalSteps = 6;

  // Handle save
  const handleSave = async () => {
    if (!user) {
      toast.error('User not authenticated. Please log in and try again.');
      console.error('Authentication error: No user found in SaaS or legacy auth system');
      return;
    }

    // Validation
    if (!name.trim()) {
      toast.error('Please enter a report name');
      setCurrentStep(1); // Go back to step 1
      return;
    }

    if (selectedModules.length === 0) {
      toast.error('Please select at least one data source');
      setCurrentStep(1); // Go back to step 1
      return;
    }

    if (metrics.length === 0) {
      toast.error('Please add at least one metric');
      setCurrentStep(4); // Go back to step 4
      return;
    }

    setIsSaving(true);

    try {
      const config: ReportConfig = {
        dataSources: selectedModules.map(module => ({
          module,
          entity: getEntityName(module),
        })),
        dateRange: {
          type: 'preset',
          preset: dateRangePreset,
        },
        filters,
        dimensions,
        metrics,
        sortBy: [],
      };

      const template: ReportTemplate = {
        id: `custom-${Date.now()}`,
        name,
        description,
        category,
        module: selectedModules.length === 1 ? selectedModules[0] : 'cross-module',
        config,
        visualizationType: ['table', 'bar-chart'],
        defaultVisualization: 'table',
        isSystemTemplate: false,
        isShared: false,
        createdBy: user.id,
        sharedWith: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generationCount: 0,
        tags: [],
        isFavorite: false,
      };

      saveReportTemplate(template);
      toast.success('Report template saved successfully');

      if (onSave) {
        onSave(template);
      }

      onClose();
    } catch (error) {
      console.error('Error saving report template:', error);
      toast.error('Failed to save report template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation
  const goNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add filter
  const addFilter = () => {
    setFilters([
      ...filters,
      {
        id: `filter-${Date.now()}`,
        field: '',
        fieldLabel: '',
        operator: 'equals',
        value: '',
        dataType: 'text',
      },
    ]);
  };

  // Remove filter
  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  // Add dimension
  const addDimension = () => {
    setDimensions([
      ...dimensions,
      {
        id: `dim-${Date.now()}`,
        field: '',
        label: '',
        groupBy: 'exact',
      },
    ]);
  };

  // Remove dimension
  const removeDimension = (id: string) => {
    setDimensions(dimensions.filter(d => d.id !== id));
  };

  // Add metric
  const addMetric = () => {
    setMetrics([
      ...metrics,
      {
        id: `metric-${Date.now()}`,
        field: '',
        label: '',
        aggregation: 'count',
        format: { type: 'number', decimals: 0 },
      },
    ]);
  };

  // Remove metric
  const removeMetric = (id: string) => {
    setMetrics(metrics.filter(m => m.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-heading)' }}>
              Create Custom Report
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(currentStep / totalSteps) * 100}%`,
              backgroundColor: 'var(--color-primary)'
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Info & Data Source */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4" style={{ color: 'var(--color-heading)' }}>
                  Report Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label>Report Name *</Label>
                    <Input
                      placeholder="e.g., Monthly Sales Performance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe what this report shows..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as ReportCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="financial-analysis">Financial Analysis</SelectItem>
                        <SelectItem value="sales-performance">Sales Performance</SelectItem>
                        <SelectItem value="inventory-analysis">Inventory Analysis</SelectItem>
                        <SelectItem value="lead-analytics">Lead Analytics</SelectItem>
                        <SelectItem value="agent-performance">Agent Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4" style={{ color: 'var(--color-heading)' }}>
                  Data Sources *
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Select which modules to include in this report
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {moduleOptions.map(option => (
                    <div
                      key={option.value}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedModules.includes(option.value)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => {
                        if (selectedModules.includes(option.value)) {
                          setSelectedModules(selectedModules.filter(m => m !== option.value));
                        } else {
                          setSelectedModules([...selectedModules, option.value]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedModules.includes(option.value)}
                          onCheckedChange={() => { }}
                        />
                        <div>
                          <div className="font-medium" style={{ color: 'var(--color-heading)' }}>
                            {option.label}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick-Start Financial Templates */}
              <div>
                <h3 className="font-medium mb-4" style={{ color: 'var(--color-heading)' }}>
                  Quick-Start Templates
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Start with a pre-configured financial report template
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-300"
                    onClick={() => {
                      setName('Accounts Receivable Report');
                      setDescription('Track pending payments from property sales - money owed TO the agency');
                      setCategory('financial-analysis');
                      setSelectedModules(['deals', 'financials']);
                      setDateRangePreset('this-month');
                      // Add starter filters
                      setFilters([
                        {
                          id: 'filter-deal-type',
                          field: 'dealType',
                          fieldLabel: 'Deal Type',
                          operator: 'equals',
                          value: 'sale',
                          dataType: 'select',
                        },
                        {
                          id: 'filter-payment-status',
                          field: 'paymentStatus',
                          fieldLabel: 'Payment Status',
                          operator: 'in',
                          value: 'pending,partial',
                          dataType: 'multi-select',
                        },
                      ]);
                      // Add starter dimensions
                      setDimensions([
                        {
                          id: 'dim-buyer',
                          field: 'buyerName',
                          label: 'Buyer',
                          groupBy: 'exact',
                        },
                      ]);
                      // Add starter metrics
                      setMetrics([
                        {
                          id: 'metric-total-receivable',
                          field: 'amountDue',
                          label: 'Total Receivable',
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                        {
                          id: 'metric-amount-paid',
                          field: 'amountPaid',
                          label: 'Amount Paid',
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                        {
                          id: 'metric-amount-pending',
                          field: 'amountPending',
                          label: 'Amount Pending',
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                      ]);
                      toast.success('Accounts Receivable template loaded - review and customize');
                    }}
                  >
                    <div className="font-medium mb-1" style={{ color: 'var(--color-heading)' }}>
                      💰 Accounts Receivable
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Money coming INTO the agency
                    </p>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-300"
                    onClick={() => {
                      setName('Accounts Payable Report');
                      setDescription('Track pending payments for property purchases - money the agency OWES');
                      setCategory('financial-analysis');
                      setSelectedModules(['deals', 'financials']);
                      setDateRangePreset('this-month');
                      // Add starter filters
                      setFilters([
                        {
                          id: 'filter-deal-type',
                          field: 'dealType',
                          fieldLabel: 'Deal Type',
                          operator: 'equals',
                          value: 'purchase',
                          dataType: 'select',
                        },
                        {
                          id: 'filter-payment-status',
                          field: 'paymentStatus',
                          fieldLabel: 'Payment Status',
                          operator: 'in',
                          value: 'pending,partial',
                          dataType: 'multi-select',
                        },
                      ]);
                      // Add starter dimensions
                      setDimensions([
                        {
                          id: 'dim-seller',
                          field: 'sellerName',
                          label: 'Seller',
                          groupBy: 'exact',
                        },
                      ]);
                      // Add starter metrics
                      setMetrics([
                        {
                          id: 'metric-total-payable',
                          field: 'amountDue',
                          label: 'Total Payable',
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                        {
                          id: 'metric-amount-paid',
                          field: 'amountPaid',
                          label: 'Amount Paid',
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                        {
                          id: 'metric-amount-remaining',
                          field: 'amountRemaining',
                          label: 'Amount Remaining',
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                      ]);
                      toast.success('Accounts Payable template loaded - review and customize');
                    }}
                  >
                    <div className="font-medium mb-1" style={{ color: 'var(--color-heading)' }}>
                      📤 Accounts Payable
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Money GOING OUT of the agency
                    </p>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-300"
                    onClick={() => {
                      setName('Monthly Revenue Projection');
                      setDescription('Project expected revenue based on pipeline deals and scheduled closings');
                      setCategory('financial-analysis');
                      setSelectedModules(['deals', 'financials']);
                      setDateRangePreset('this-month');
                      // Add starter filters
                      setFilters([
                        {
                          id: 'filter-deal-status',
                          field: 'status',
                          fieldLabel: 'Deal Status',
                          operator: 'in',
                          value: 'negotiation,closing,won',
                          dataType: 'multi-select',
                        },
                      ]);
                      // Add starter dimensions
                      setDimensions([
                        {
                          id: 'dim-confidence',
                          field: 'confidenceLevel',
                          label: 'Confidence Level',
                          groupBy: 'exact',
                        },
                      ]);
                      // Add starter metrics
                      setMetrics([
                        {
                          id: 'metric-projected-revenue',
                          field: 'expectedRevenue',
                          label: 'Projected Revenue',
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                        {
                          id: 'metric-expected-commission',
                          field: 'expectedCommission',
                          label: 'Expected Commission',
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                        {
                          id: 'metric-deal-count',
                          field: 'id',
                          label: 'Number of Deals',
                          aggregation: 'count',
                          format: { type: 'number', decimals: 0 },
                        },
                      ]);
                      toast.success('Revenue Projection template loaded - review and customize');
                    }}
                  >
                    <div className="font-medium mb-1" style={{ color: 'var(--color-heading)' }}>
                      📈 Monthly Revenue Projection
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      What will I make this month?
                    </p>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-300"
                    onClick={() => {
                      setName('Daily Operations Dashboard');
                      setDescription('Real-time snapshot of daily activities and cash position');
                      setCategory('operational');
                      setSelectedModules(['deals', 'leads', 'financials']);
                      setDateRangePreset('today');
                      // No filters for daily dashboard
                      setFilters([]);
                      // Add starter dimensions
                      setDimensions([
                        {
                          id: 'dim-activity-type',
                          field: 'activityType',
                          label: 'Activity Type',
                          groupBy: 'exact',
                        },
                      ]);
                      // Add starter metrics
                      setMetrics([
                        {
                          id: 'metric-cash-in',
                          field: 'cashInflow',
                          label: "Today's Cash In",
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                        {
                          id: 'metric-cash-out',
                          field: 'cashOutflow',
                          label: "Today's Cash Out",
                          aggregation: 'sum',
                          format: { type: 'currency', decimals: 0 },
                        },
                        {
                          id: 'metric-new-leads',
                          field: 'leadId',
                          label: 'New Leads Today',
                          aggregation: 'count-distinct',
                          format: { type: 'number', decimals: 0 },
                        },
                        {
                          id: 'metric-deals-closed',
                          field: 'dealId',
                          label: 'Deals Closed Today',
                          aggregation: 'count-distinct',
                          format: { type: 'number', decimals: 0 },
                        },
                      ]);
                      toast.success('Daily Operations template loaded - review and customize');
                    }}
                  >
                    <div className="font-medium mb-1" style={{ color: 'var(--color-heading)' }}>
                      📊 Daily Operations
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Today's activities and cash flow
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Date Range & Filters */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4" style={{ color: 'var(--color-heading)' }}>
                  Date Range
                </h3>

                <Select value={dateRangePreset} onValueChange={(value) => setDateRangePreset(value as DateRangePreset)}>
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
                    <SelectItem value="this-year">This Year</SelectItem>
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

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium" style={{ color: 'var(--color-heading)' }}>
                    Filters (Optional)
                  </h3>
                  <Button variant="outline" size="sm" onClick={addFilter}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>
                </div>

                {filters.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Filter className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No filters added. Click "Add Filter" to create one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filters.map((filter, index) => (
                      <Card key={filter.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Field</Label>
                              <Input
                                placeholder="e.g., status"
                                value={filter.field}
                                onChange={(e) => {
                                  const updated = [...filters];
                                  updated[index].field = e.target.value;
                                  setFilters(updated);
                                }}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Operator</Label>
                              <Select
                                value={filter.operator}
                                onValueChange={(value) => {
                                  const updated = [...filters];
                                  updated[index].operator = value as FilterOperator;
                                  setFilters(updated);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not-equals">Not Equals</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="greater-than">Greater Than</SelectItem>
                                  <SelectItem value="less-than">Less Than</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">Value</Label>
                              <Input
                                placeholder="Enter value"
                                value={filter.value}
                                onChange={(e) => {
                                  const updated = [...filters];
                                  updated[index].value = e.target.value;
                                  setFilters(updated);
                                }}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter(filter.id)}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Dimensions & Grouping */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--color-heading)' }}>
                    Dimensions (Optional)
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Group data by specific fields (e.g., by Agent, Property Type, Month)
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addDimension}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dimension
                </Button>
              </div>

              {dimensions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No dimensions added. Skip this step for a simple list, or add dimensions to group your data.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dimensions.map((dim, index) => (
                    <Card key={dim.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Field</Label>
                            <Input
                              placeholder="e.g., agentName"
                              value={dim.field}
                              onChange={(e) => {
                                const updated = [...dimensions];
                                updated[index].field = e.target.value;
                                setDimensions(updated);
                              }}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                              placeholder="e.g., Agent"
                              value={dim.label}
                              onChange={(e) => {
                                const updated = [...dimensions];
                                updated[index].label = e.target.value;
                                setDimensions(updated);
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDimension(dim.id)}
                          className="mt-6"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Metrics & Calculations */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--color-heading)' }}>
                    Metrics *
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Define what to measure (e.g., Count, Sum, Average)
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addMetric}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Metric
                </Button>
              </div>

              {metrics.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Database className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    No metrics added. Add at least one metric to continue.
                  </p>
                  <Button onClick={addMetric}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Metric
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.map((metric, index) => (
                    <Card key={metric.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Field</Label>
                            <Input
                              placeholder="e.g., dealValue"
                              value={metric.field}
                              onChange={(e) => {
                                const updated = [...metrics];
                                updated[index].field = e.target.value;
                                setMetrics(updated);
                              }}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Aggregation</Label>
                            <Select
                              value={metric.aggregation}
                              onValueChange={(value) => {
                                const updated = [...metrics];
                                updated[index].aggregation = value as AggregationType;
                                setMetrics(updated);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="count">Count</SelectItem>
                                <SelectItem value="sum">Sum</SelectItem>
                                <SelectItem value="average">Average</SelectItem>
                                <SelectItem value="min">Minimum</SelectItem>
                                <SelectItem value="max">Maximum</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                              placeholder="e.g., Total Revenue"
                              value={metric.label}
                              onChange={(e) => {
                                const updated = [...metrics];
                                updated[index].label = e.target.value;
                                setMetrics(updated);
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMetric(metric.id)}
                          className="mt-6"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Chart Configuration */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4" style={{ color: 'var(--color-heading)' }}>
                  Chart Configuration
                </h3>

                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Enable Charts
                    </div>
                    <Checkbox
                      checked={enableCharts}
                      onCheckedChange={(checked) => setEnableCharts(checked)}
                    />
                  </Card>

                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Default Chart Type
                    </div>
                    <Select
                      value={defaultChartType}
                      onValueChange={(value) => setDefaultChartType(value as 'bar' | 'line' | 'pie')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </Card>

                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Chart Colors
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {chartColors.map((color, index) => (
                        <Badge key={index} variant="secondary" style={{ backgroundColor: color }}>
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Preview & Save */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4" style={{ color: 'var(--color-heading)' }}>
                  Review Your Report
                </h3>

                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Report Name
                    </div>
                    <div style={{ color: 'var(--color-text)' }}>{name || '(Not set)'}</div>
                  </Card>

                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Data Sources
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedModules.map(module => (
                        <Badge key={module} variant="secondary">
                          {moduleOptions.find(m => m.value === module)?.label}
                        </Badge>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Date Range
                    </div>
                    <Badge variant="outline">{dateRangePreset}</Badge>
                  </Card>

                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Filters
                    </div>
                    <div style={{ color: 'var(--color-text)' }}>
                      {filters.length} filter(s) configured
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Dimensions
                    </div>
                    <div style={{ color: 'var(--color-text)' }}>
                      {dimensions.length} dimension(s) configured
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                      Metrics
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {metrics.map(metric => (
                        <Badge key={metric.id} variant="secondary">
                          {metric.label || metric.field} ({metric.aggregation})
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <Button onClick={goNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-primary-500 rounded-full" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Report
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// CONSTANTS
// ============================================

const moduleOptions: { value: ReportModule; label: string; description: string }[] = [
  {
    value: 'properties',
    label: 'Properties',
    description: 'Property inventory and portfolio',
  },
  {
    value: 'leads',
    label: 'Leads',
    description: 'Lead management and pipeline',
  },
  {
    value: 'contacts',
    label: 'Contacts',
    description: 'Client and contact data',
  },
  {
    value: 'deals',
    label: 'Deals',
    description: 'Transactions and cycles',
  },
  {
    value: 'financials',
    label: 'Financials',
    description: 'Revenue, expenses, commissions',
  },
  {
    value: 'requirements',
    label: 'Requirements',
    description: 'Buyer and rent requirements',
  },
];

function getEntityName(module: ReportModule): string {
  const mapping: Record<ReportModule, string> = {
    properties: 'Property',
    leads: 'Lead',
    contacts: 'Contact',
    deals: 'Deal',
    financials: 'Transaction',
    portfolio: 'PortfolioProperty',
    performance: 'Performance',
    requirements: 'Requirement',
    cycles: 'Cycle',
    'cross-module': 'Mixed',
  };

  return mapping[module] || module;
}