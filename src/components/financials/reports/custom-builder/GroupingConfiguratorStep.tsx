/**
 * GroupingConfiguratorStep Component
 * 
 * Step 4 of custom report builder - Configure grouping and aggregations.
 * Allows users to group data and apply aggregation functions.
 * 
 * Features:
 * - Select group-by fields
 * - Add aggregation functions (SUM, AVG, COUNT, MIN, MAX)
 * - Sort groups
 * - Preview grouping structure
 * 
 * Design System V4.1 Compliant
 */

import React, { useState } from 'react';
import { 
  ReportConfiguration, 
  GroupingConfig, 
  AggregationConfig,
  SelectedField 
} from '../../../../types/custom-reports';
import { User } from '../../../../types';
import { Button } from '../../../ui/button';
import { Label } from '../../../ui/label';
import { Checkbox } from '../../../ui/checkbox';
import { 
  Plus, 
  X, 
  Layers,
  AlertCircle,
  TrendingUp,
  Check
} from 'lucide-react';

interface GroupingConfiguratorStepProps {
  config: Partial<ReportConfiguration>;
  onChange: (updates: Partial<ReportConfiguration>) => void;
  user: User;
}

// Aggregation function options
const AGGREGATION_FUNCTIONS = [
  { value: 'sum', label: 'Sum', icon: '∑' },
  { value: 'avg', label: 'Average', icon: '⌀' },
  { value: 'count', label: 'Count', icon: '#' },
  { value: 'min', label: 'Minimum', icon: '↓' },
  { value: 'max', label: 'Maximum', icon: '↑' },
];

export const GroupingConfiguratorStep: React.FC<GroupingConfiguratorStepProps> = ({
  config,
  onChange,
  user,
}) => {
  const [groupingEnabled, setGroupingEnabled] = useState(!!config.grouping);
  const selectedFields = config.fields || [];

  // Get fields that can be used for grouping
  const groupableFields = selectedFields.filter(f => 
    f.type === 'text' || f.type === 'date' || f.type === 'boolean'
  );

  // Get fields that can be aggregated
  const aggregatableFields = selectedFields.filter(f => 
    f.type === 'number' || f.type === 'currency'
  );

  // Initialize grouping config
  const initializeGrouping = () => {
    if (!config.grouping) {
      const defaultGrouping: GroupingConfig = {
        groupBy: [],
        aggregations: [],
        sortGroupsBy: 'name',
        sortDirection: 'asc',
      };
      onChange({ grouping: defaultGrouping });
    }
  };

  // Toggle grouping
  const handleToggleGrouping = (enabled: boolean) => {
    setGroupingEnabled(enabled);
    if (enabled) {
      initializeGrouping();
    } else {
      onChange({ grouping: undefined });
    }
  };

  // Toggle group-by field
  const handleToggleGroupByField = (fieldPath: string) => {
    const currentGrouping = config.grouping || { 
      groupBy: [], 
      aggregations: [],
      sortGroupsBy: 'name',
      sortDirection: 'asc',
    };

    const isSelected = currentGrouping.groupBy.includes(fieldPath);
    const newGroupBy = isSelected
      ? currentGrouping.groupBy.filter(f => f !== fieldPath)
      : [...currentGrouping.groupBy, fieldPath];

    onChange({
      grouping: {
        ...currentGrouping,
        groupBy: newGroupBy,
      }
    });
  };

  // Add aggregation
  const handleAddAggregation = () => {
    if (aggregatableFields.length === 0) return;

    const currentGrouping = config.grouping || { 
      groupBy: [], 
      aggregations: [],
      sortGroupsBy: 'name',
      sortDirection: 'asc',
    };

    const firstField = aggregatableFields[0];
    const newAggregation: AggregationConfig = {
      field: firstField.field,
      function: 'sum',
      label: `${firstField.label} (Sum)`,
    };

    onChange({
      grouping: {
        ...currentGrouping,
        aggregations: [...currentGrouping.aggregations, newAggregation],
      }
    });
  };

  // Remove aggregation
  const handleRemoveAggregation = (index: number) => {
    const currentGrouping = config.grouping!;
    const newAggregations = currentGrouping.aggregations.filter((_, i) => i !== index);

    onChange({
      grouping: {
        ...currentGrouping,
        aggregations: newAggregations,
      }
    });
  };

  // Update aggregation
  const handleUpdateAggregation = (index: number, updates: Partial<AggregationConfig>) => {
    const currentGrouping = config.grouping!;
    const newAggregations = currentGrouping.aggregations.map((agg, i) => {
      if (i === index) {
        const updatedAgg = { ...agg, ...updates };
        
        // Auto-update label if field or function changed
        if (updates.field || updates.function) {
          const field = aggregatableFields.find(f => f.field === (updates.field || agg.field));
          const func = AGGREGATION_FUNCTIONS.find(f => f.value === (updates.function || agg.function));
          if (field && func) {
            updatedAgg.label = `${field.label} (${func.label})`;
          }
        }
        
        return updatedAgg;
      }
      return agg;
    });

    onChange({
      grouping: {
        ...currentGrouping,
        aggregations: newAggregations,
      }
    });
  };

  // Update sort options
  const handleUpdateSort = (updates: Partial<Pick<GroupingConfig, 'sortGroupsBy' | 'sortDirection'>>) => {
    const currentGrouping = config.grouping!;
    onChange({
      grouping: {
        ...currentGrouping,
        ...updates,
      }
    });
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
        <h3 className="text-lg text-gray-900">Grouping & Aggregation (Optional)</h3>
        <p className="text-gray-600">
          Group your data by specific fields and apply aggregation functions to summarize numeric values.
        </p>
      </div>

      {/* Enable Grouping Toggle */}
      <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
        <div className="flex items-start gap-3">
          <Checkbox
            id="enable-grouping"
            checked={groupingEnabled}
            onCheckedChange={handleToggleGrouping}
            className="mt-1"
          />
          <div className="flex-1">
            <Label 
              htmlFor="enable-grouping" 
              className="cursor-pointer text-gray-900"
            >
              Enable Grouping
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Group records by common values and calculate aggregates (totals, averages, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Grouping Configuration */}
      {groupingEnabled && (
        <>
          {/* Group By Fields */}
          <div className="space-y-3">
            <div>
              <Label className="text-gray-900">Group By</Label>
              <p className="text-sm text-gray-600 mt-1">
                Select one or more fields to group your data
              </p>
            </div>

            {groupableFields.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-900">
                      No groupable fields available
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Add text or date fields in Step 2 to enable grouping
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {groupableFields.map(field => {
                  const isSelected = config.grouping?.groupBy.includes(field.field);
                  return (
                    <button
                      key={field.id}
                      onClick={() => handleToggleGroupByField(field.field)}
                      className={`
                        p-3 rounded-lg border-2 text-left transition-all
                        ${isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className={isSelected ? 'text-blue-900' : 'text-gray-900'}>
                            {field.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {field.type}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {config.grouping && config.grouping.groupBy.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  Grouping by: {config.grouping.groupBy.map(f => getFieldLabel(f)).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Aggregations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-900">Aggregations</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Calculate totals, averages, or other statistics for numeric fields
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleAddAggregation}
                disabled={aggregatableFields.length === 0}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Aggregation
              </Button>
            </div>

            {aggregatableFields.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-900">
                      No numeric fields available for aggregation
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Add number or currency fields in Step 2 to enable aggregations
                    </p>
                  </div>
                </div>
              </div>
            ) : config.grouping?.aggregations.length === 0 ? (
              <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <TrendingUp className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">No aggregations added</p>
                <p className="text-sm text-gray-500">
                  Add aggregations to calculate totals, averages, and more
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {config.grouping?.aggregations.map((agg, index) => (
                  <div key={index} className="p-4 bg-white border border-gray-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      {/* Index */}
                      <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs text-gray-600 flex-shrink-0 mt-2">
                        {index + 1}
                      </div>

                      {/* Configuration */}
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        {/* Field Selection */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Field</Label>
                          <select
                            value={agg.field}
                            onChange={(e) => handleUpdateAggregation(index, { field: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                          >
                            {aggregatableFields.map(field => (
                              <option key={field.id} value={field.field}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Function Selection */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Function</Label>
                          <select
                            value={agg.function}
                            onChange={(e) => handleUpdateAggregation(index, { function: e.target.value as any })}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                          >
                            {AGGREGATION_FUNCTIONS.map(func => (
                              <option key={func.value} value={func.value}>
                                {func.icon} {func.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAggregation(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sort Options */}
          {config.grouping && config.grouping.groupBy.length > 0 && (
            <div className="space-y-3">
              <Label className="text-gray-900">Sort Groups</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Sort By</Label>
                  <select
                    value={config.grouping.sortGroupsBy}
                    onChange={(e) => handleUpdateSort({ sortGroupsBy: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    <option value="name">Group Name</option>
                    <option value="value">Aggregate Value</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Direction</Label>
                  <select
                    value={config.grouping.sortDirection}
                    onChange={(e) => handleUpdateSort({ sortDirection: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    <option value="asc">Ascending (A-Z, 0-9)</option>
                    <option value="desc">Descending (Z-A, 9-0)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary */}
      {groupingEnabled && config.grouping && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Layers className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-900 mb-2">Grouping Summary</p>
              {config.grouping.groupBy.length === 0 ? (
                <p className="text-sm text-blue-700">
                  Select at least one field to group by
                </p>
              ) : (
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Grouping by: {config.grouping.groupBy.map(f => getFieldLabel(f)).join(', ')}</p>
                  {config.grouping.aggregations.length > 0 && (
                    <p>• {config.grouping.aggregations.length} aggregation{config.grouping.aggregations.length !== 1 ? 's' : ''} configured</p>
                  )}
                  <p>• Sorted by {config.grouping.sortGroupsBy} ({config.grouping.sortDirection})</p>
                </div>
              )}
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
              Grouping is perfect for creating summary reports. For example, group by "Agent" 
              and sum "Commission Amount" to see total commissions per agent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
