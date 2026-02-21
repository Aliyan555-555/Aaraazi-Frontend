/**
 * ChartConfiguratorStep Component
 * 
 * Step 5 of custom report builder - Configure data visualization.
 * Allows users to enable charts and configure chart settings.
 * 
 * Features:
 * - Enable/disable chart visualization
 * - Select chart type (bar, line, pie, area)
 * - Configure axes and series
 * - Customize appearance
 * 
 * Design System Compliant
 */

import React, { useState } from 'react';
import { 
  ReportConfiguration, 
  ChartConfig,
  ChartType,
  SelectedField 
} from '../../../../types/custom-reports';
import { User } from '../../../../types';
import { Button } from '../../../ui/button';
import { Label } from '../../../ui/label';
import { Input } from '../../../ui/input';
import { Checkbox } from '../../../ui/checkbox';
import { 
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  AlertCircle,
  Check,
  Palette
} from 'lucide-react';

interface ChartConfiguratorStepProps {
  config: Partial<ReportConfiguration>;
  onChange: (updates: Partial<ReportConfiguration>) => void;
  user: User;
}

// Chart type options
const CHART_TYPES: Array<{
  value: ChartType;
  label: string;
  icon: React.ReactNode;
  description: string;
  requirements: string;
}> = [
  {
    value: 'bar',
    label: 'Bar Chart',
    icon: <BarChart3 className="h-8 w-8" />,
    description: 'Compare values across categories',
    requirements: 'Requires 1 text field and 1+ numeric fields',
  },
  {
    value: 'line',
    label: 'Line Chart',
    icon: <LineChart className="h-8 w-8" />,
    description: 'Show trends over time',
    requirements: 'Requires 1 date field and 1+ numeric fields',
  },
  {
    value: 'pie',
    label: 'Pie Chart',
    icon: <PieChart className="h-8 w-8" />,
    description: 'Show proportions of a whole',
    requirements: 'Requires 1 text field and 1 numeric field',
  },
  {
    value: 'area',
    label: 'Area Chart',
    icon: <AreaChart className="h-8 w-8" />,
    description: 'Show cumulative trends',
    requirements: 'Requires 1 date field and 1+ numeric fields',
  },
];

// Color schemes
const COLOR_SCHEMES = [
  { value: 'default', label: 'Default', colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'] },
  { value: 'blue', label: 'Blue Tones', colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'] },
  { value: 'green', label: 'Green Tones', colors: ['#065f46', '#10b981', '#34d399', '#6ee7b7'] },
  { value: 'red', label: 'Red Tones', colors: ['#991b1b', '#ef4444', '#f87171', '#fca5a5'] },
  { value: 'purple', label: 'Purple Tones', colors: ['#5b21b6', '#8b5cf6', '#a78bfa', '#c4b5fd'] },
];

export const ChartConfiguratorStep: React.FC<ChartConfiguratorStepProps> = ({
  config,
  onChange,
  user,
}) => {
  const [chartEnabled, setChartEnabled] = useState(!!config.chart?.enabled);
  const selectedFields = config.fields || [];

  // Get fields by type
  const textFields = selectedFields.filter(f => f.type === 'text');
  const numericFields = selectedFields.filter(f => 
    f.type === 'number' || f.type === 'currency' || f.type === 'percentage'
  );
  const dateFields = selectedFields.filter(f => f.type === 'date');

  // Initialize chart config
  const initializeChart = (chartType: ChartType) => {
    const defaultChart: ChartConfig = {
      enabled: true,
      chartType,
      showLegend: true,
      showGrid: true,
      colorScheme: 'default',
    };

    // Set default axes based on chart type
    if (chartType === 'bar' || chartType === 'pie') {
      defaultChart.xAxis = textFields[0]?.field;
      defaultChart.yAxis = numericFields[0]?.field;
    } else if (chartType === 'line' || chartType === 'area') {
      defaultChart.xAxis = dateFields[0]?.field || textFields[0]?.field;
      defaultChart.yAxis = numericFields[0]?.field;
    }

    onChange({ chart: defaultChart });
  };

  // Toggle chart
  const handleToggleChart = (enabled: boolean) => {
    setChartEnabled(enabled);
    if (enabled && !config.chart) {
      initializeChart('bar');
    } else if (!enabled) {
      onChange({ chart: undefined });
    }
  };

  // Update chart config
  const handleUpdateChart = (updates: Partial<ChartConfig>) => {
    if (!config.chart) return;

    onChange({
      chart: {
        ...config.chart,
        ...updates,
      }
    });
  };

  // Select chart type
  const handleSelectChartType = (chartType: ChartType) => {
    if (config.chart) {
      initializeChart(chartType);
    }
  };

  // Check if chart type is available
  const isChartTypeAvailable = (chartType: ChartType): boolean => {
    switch (chartType) {
      case 'bar':
      case 'pie':
        return textFields.length > 0 && numericFields.length > 0;
      case 'line':
      case 'area':
        return (dateFields.length > 0 || textFields.length > 0) && numericFields.length > 0;
      default:
        return false;
    }
  };

  // Get field label
  const getFieldLabel = (fieldPath: string): string => {
    const field = selectedFields.find(f => f.field === fieldPath);
    return field ? field.label : fieldPath;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg text-gray-900">Chart Visualization (Optional)</h3>
        <p className="text-gray-600">
          Add a chart to visualize your report data. Charts make it easier to spot trends and patterns.
        </p>
      </div>

      {/* Enable Chart Toggle */}
      <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
        <div className="flex items-start gap-3">
          <Checkbox
            id="enable-chart"
            checked={chartEnabled}
            onCheckedChange={handleToggleChart}
            className="mt-1"
          />
          <div className="flex-1">
            <Label 
              htmlFor="enable-chart" 
              className="cursor-pointer text-gray-900"
            >
              Enable Chart Visualization
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Add a visual representation of your report data
            </p>
          </div>
        </div>
      </div>

      {/* Chart Configuration */}
      {chartEnabled && (
        <>
          {/* Chart Type Selection */}
          <div className="space-y-3">
            <Label className="text-gray-900">Select Chart Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {CHART_TYPES.map(type => {
                const isAvailable = isChartTypeAvailable(type.value);
                const isSelected = config.chart?.chartType === type.value;

                return (
                  <button
                    key={type.value}
                    onClick={() => isAvailable && handleSelectChartType(type.value)}
                    disabled={!isAvailable}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${!isAvailable 
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300'
                        : isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={isSelected ? 'text-blue-600' : 'text-gray-600'}>
                        {type.icon}
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className={isSelected ? 'text-blue-900' : 'text-gray-900'}>
                      {type.label}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {type.description}
                    </p>
                    {!isAvailable && (
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ {type.requirements}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Axis Configuration */}
          {config.chart && (
            <>
              <div className="space-y-3">
                <Label className="text-gray-900">Configure Axes</Label>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* X Axis */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">X-Axis (Horizontal)</Label>
                    <select
                      value={config.chart.xAxis || ''}
                      onChange={(e) => handleUpdateChart({ xAxis: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                    >
                      <option value="">Select field...</option>
                      {config.chart.chartType === 'line' || config.chart.chartType === 'area' ? (
                        <>
                          {dateFields.length > 0 && (
                            <optgroup label="Date Fields">
                              {dateFields.map(field => (
                                <option key={field.id} value={field.field}>
                                  {field.label}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {textFields.length > 0 && (
                            <optgroup label="Text Fields">
                              {textFields.map(field => (
                                <option key={field.id} value={field.field}>
                                  {field.label}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      ) : (
                        textFields.map(field => (
                          <option key={field.id} value={field.field}>
                            {field.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Y Axis */}
                  {config.chart.chartType !== 'pie' && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Y-Axis (Vertical)</Label>
                      <select
                        value={config.chart.yAxis || ''}
                        onChange={(e) => handleUpdateChart({ yAxis: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                      >
                        <option value="">Select field...</option>
                        {numericFields.map(field => (
                          <option key={field.id} value={field.field}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Title */}
              <div className="space-y-1">
                <Label className="text-gray-900">Chart Title (Optional)</Label>
                <Input
                  value={config.chart.title || ''}
                  onChange={(e) => handleUpdateChart({ title: e.target.value })}
                  placeholder="e.g., Sales by Month"
                />
              </div>

              {/* Appearance Options */}
              <div className="space-y-3">
                <Label className="text-gray-900">Appearance</Label>
                
                <div className="space-y-2">
                  {/* Color Scheme */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Color Scheme</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_SCHEMES.map(scheme => (
                        <button
                          key={scheme.value}
                          onClick={() => handleUpdateChart({ colorScheme: scheme.value as any })}
                          className={`
                            p-3 rounded-lg border-2 transition-all
                            ${config.chart?.colorScheme === scheme.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-300 bg-white hover:border-blue-400'
                            }
                          `}
                        >
                          <div className="flex gap-1 mb-2">
                            {scheme.colors.map((color, i) => (
                              <div
                                key={i}
                                className="h-4 flex-1 rounded"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-700">{scheme.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="show-legend"
                        checked={config.chart.showLegend}
                        onCheckedChange={(checked) => handleUpdateChart({ showLegend: checked as boolean })}
                      />
                      <Label htmlFor="show-legend" className="cursor-pointer text-sm">
                        Show Legend
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="show-grid"
                        checked={config.chart.showGrid}
                        onCheckedChange={(checked) => handleUpdateChart({ showGrid: checked as boolean })}
                      />
                      <Label htmlFor="show-grid" className="cursor-pointer text-sm">
                        Show Grid Lines
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Requirements Info */}
      {chartEnabled && (textFields.length === 0 || numericFields.length === 0) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-900 mb-2">Missing Required Fields</p>
              <div className="text-sm text-yellow-700 space-y-1">
                {textFields.length === 0 && (
                  <p>• Add at least one text field for category labels</p>
                )}
                {numericFields.length === 0 && (
                  <p>• Add at least one numeric field for values</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {chartEnabled && config.chart && config.chart.xAxis && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Palette className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-900 mb-2">Chart Configuration</p>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Type: {CHART_TYPES.find(t => t.value === config.chart?.chartType)?.label}</p>
                <p>• X-Axis: {getFieldLabel(config.chart.xAxis)}</p>
                {config.chart.yAxis && (
                  <p>• Y-Axis: {getFieldLabel(config.chart.yAxis)}</p>
                )}
                {config.chart.title && (
                  <p>• Title: {config.chart.title}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Tip */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full flex-shrink-0">
            <span className="text-xs text-blue-600">💡</span>
          </div>
          <div>
            <p className="text-blue-900 mb-1">Pro Tip</p>
            <p className="text-sm text-blue-700">
              Charts are optional but highly recommended for financial reports. 
              They help stakeholders quickly understand trends and patterns in your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
