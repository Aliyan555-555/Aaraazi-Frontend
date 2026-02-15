import React, { useState, useMemo } from 'react';
import { ReportConfiguration, FilterRule, SelectedField } from '../../../../types/custom-reports';
import { User } from '../../../../types';
import { FilterOperator } from '../../../../types/reports';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import {
  Plus,
  X,
  Filter,
  AlertCircle,
  Zap
} from 'lucide-react';

interface FilterConfiguratorStepProps {
  config: Partial<ReportConfiguration>;
  onChange: (updates: Partial<ReportConfiguration>) => void;
  user: User;
}

// Operator options by field type
const OPERATORS_BY_TYPE: { [key: string]: Array<{ value: string; label: string }> } = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'not-equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not-contains', label: 'Does Not Contain' },
    { value: 'starts-with', label: 'Starts With' },
    { value: 'ends-with', label: 'Ends With' },
    { value: 'is-null', label: 'Is Empty' },
    { value: 'is-not-null', label: 'Is Not Empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not-equals', label: 'Not Equals' },
    { value: 'greater-than', label: 'Greater Than' },
    { value: 'less-than', label: 'Less Than' },
    { value: 'greater-or-equal', label: 'Greater or Equal' },
    { value: 'less-or-equal', label: 'Less or Equal' },
    { value: 'between', label: 'Between' },
    { value: 'is-null', label: 'Is Empty' },
    { value: 'is-not-null', label: 'Is Not Empty' },
  ],
  currency: [
    { value: 'equals', label: 'Equals' },
    { value: 'not-equals', label: 'Not Equals' },
    { value: 'greater-than', label: 'Greater Than' },
    { value: 'less-than', label: 'Less Than' },
    { value: 'greater-or-equal', label: 'Greater or Equal' },
    { value: 'less-or-equal', label: 'Less or Equal' },
    { value: 'between', label: 'Between' },
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'not-equals', label: 'Not Equals' },
    { value: 'greater-than', label: 'After' },
    { value: 'less-than', label: 'Before' },
    { value: 'between', label: 'Between' },
  ],
  boolean: [
    { value: 'equals', label: 'Equals' },
  ],
};

export const FilterConfiguratorStep: React.FC<FilterConfiguratorStepProps> = ({
  config,
  onChange,
  user,
}) => {
  const filters = config.filters || [];
  const selectedFields = config.fields || [];

  // Generate filter ID
  const generateFilterId = (): string => {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add new filter
  const handleAddFilter = () => {
    if (selectedFields.length === 0) {
      return;
    }

    const firstField = selectedFields[0];
    const newFilter: FilterRule = {
      id: generateFilterId(),
      field: firstField.field,
      fieldType: firstField.type,
      operator: 'equals' as FilterOperator,
      value: '',
      logicalOperator: filters.length === 0 ? 'AND' : 'AND',
    };

    onChange({ filters: [...filters, newFilter] });
  };

  // Remove filter
  const handleRemoveFilter = (filterId: string) => {
    onChange({
      filters: filters.filter(f => f.id !== filterId)
    });
  };

  // Update filter
  const handleUpdateFilter = (filterId: string, updates: Partial<FilterRule>) => {
    const updatedFilters = filters.map(f => {
      if (f.id === filterId) {
        // If field changed, update field type and reset operator
        if (updates.field) {
          const field = selectedFields.find(sf => sf.field === updates.field);
          if (field) {
            return {
              ...f,
              ...updates,
              fieldType: field.type,
              operator: 'equals' as FilterOperator,
              value: '',
            };
          }
        }
        return { ...f, ...updates };
      }
      return f;
    });

    onChange({ filters: updatedFilters });
  };

  // Get field label by field path
  const getFieldLabel = (fieldPath: string): string => {
    const field = selectedFields.find(f => f.field === fieldPath);
    return field ? field.label : fieldPath;
  };

  // Get operators for field type
  const getOperatorsForField = (fieldType: string) => {
    return OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.text;
  };

  // Check if operator needs value input
  const operatorNeedsValue = (operator: string): boolean => {
    return !['is-null', 'is-not-null'].includes(operator);
  };

  // Render value input based on field type and operator
  const renderValueInput = (filter: FilterRule) => {
    if (!operatorNeedsValue(filter.operator)) {
      return null;
    }

    if (filter.operator === 'between') {
      return (
        <div className="flex items-center gap-2">
          <Input
            type={filter.fieldType === 'date' ? 'date' : 'text'}
            value={Array.isArray(filter.value) ? filter.value[0] : ''}
            onChange={(e) => handleUpdateFilter(filter.id, {
              value: [e.target.value, Array.isArray(filter.value) ? filter.value[1] : '']
            })}
            placeholder="Min"
            className="flex-1"
          />
          <span className="text-gray-500">to</span>
          <Input
            type={filter.fieldType === 'date' ? 'date' : 'text'}
            value={Array.isArray(filter.value) ? filter.value[1] : ''}
            onChange={(e) => handleUpdateFilter(filter.id, {
              value: [Array.isArray(filter.value) ? filter.value[0] : '', e.target.value]
            })}
            placeholder="Max"
            className="flex-1"
          />
        </div>
      );
    }

    if (filter.fieldType === 'boolean') {
      return (
        <select
          value={filter.value}
          onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value === 'true' })}
          className="flex-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    return (
      <Input
        type={filter.fieldType === 'date' ? 'date' : 'text'}
        value={filter.value}
        onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
        placeholder="Enter value..."
        className="flex-1"
      />
    );
  };

  // Quick filter presets
  const applyQuickFilter = (preset: 'last-30-days' | 'this-month' | 'active-only') => {
    const newFilters: FilterRule[] = [];

    switch (preset) {
      case 'last-30-days': {
        const dateField = selectedFields.find(f => f.type === 'date');
        if (dateField) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          newFilters.push({
            id: generateFilterId(),
            field: dateField.field,
            fieldType: 'date',
            operator: 'greater-than',
            value: thirtyDaysAgo.toISOString().split('T')[0],
            logicalOperator: 'AND',
          });
        }
        break;
      }

      case 'this-month': {
        const dateField = selectedFields.find(f => f.type === 'date');
        if (dateField) {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          newFilters.push({
            id: generateFilterId(),
            field: dateField.field,
            fieldType: 'date',
            operator: 'between',
            value: [
              firstDay.toISOString().split('T')[0],
              lastDay.toISOString().split('T')[0]
            ],
            logicalOperator: 'AND',
          });
        }
        break;
      }

      case 'active-only': {
        const statusField = selectedFields.find(f =>
          f.field.includes('status') || f.label.toLowerCase().includes('status')
        );
        if (statusField) {
          newFilters.push({
            id: generateFilterId(),
            field: statusField.field,
            fieldType: 'text',
            operator: 'not-equals',
            value: 'closed',
            logicalOperator: 'AND',
          });
        }
        break;
      }
    }

    if (newFilters.length > 0) {
      onChange({ filters: [...filters, ...newFilters] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg text-gray-900">Add Filters (Optional)</h3>
        <p className="text-gray-600">
          Filter your data to show only the records that match specific criteria. Filters are optional.
        </p>
      </div>

      {/* Quick Filters */}
      {selectedFields.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-blue-900 mb-2">Quick Filters</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyQuickFilter('last-30-days')}
                  className="bg-white"
                >
                  Last 30 Days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyQuickFilter('this-month')}
                  className="bg-white"
                >
                  This Month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyQuickFilter('active-only')}
                  className="bg-white"
                >
                  Active Only
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Rules */}
      <div className="space-y-4">
        {filters.length === 0 ? (
          <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No filters added yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Add filters to narrow down your data
            </p>
            <Button
              onClick={handleAddFilter}
              disabled={selectedFields.length === 0}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Filter
            </Button>
          </div>
        ) : (
          <>
            {/* Filter List */}
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={filter.id} className="relative">
                  {/* Logical Operator Badge */}
                  {index > 0 && (
                    <div className="absolute -top-3 left-4 z-10">
                      <select
                        value={filter.logicalOperator}
                        onChange={(e) => handleUpdateFilter(filter.id, {
                          logicalOperator: e.target.value as 'AND' | 'OR'
                        })}
                        className="h-6 px-2 text-xs rounded bg-gray-700 text-white border-none"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                  )}

                  {/* Filter Card */}
                  <div className="p-4 bg-white border border-gray-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      {/* Filter Number */}
                      <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs text-gray-600 flex-shrink-0 mt-2">
                        {index + 1}
                      </div>

                      {/* Filter Configuration */}
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        {/* Field Selection */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Field</Label>
                          <select
                            value={filter.field}
                            onChange={(e) => handleUpdateFilter(filter.id, { field: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                          >
                            {selectedFields.map(field => (
                              <option key={field.id} value={field.field}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Operator Selection */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Operator</Label>
                          <select
                            value={filter.operator}
                            onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value as any })}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                          >
                            {getOperatorsForField(filter.fieldType).map(op => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Value Input */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Value</Label>
                          {renderValueInput(filter)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFilter(filter.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Filter Button */}
            <Button
              onClick={handleAddFilter}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Filter
            </Button>
          </>
        )}
      </div>

      {/* Filter Summary */}
      {filters.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Filter className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-900">
                {filters.length} filter{filters.length !== 1 ? 's' : ''} applied
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your report will only include records that match {filters.length === 1 ? 'this filter' : 'these conditions'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Message */}
      {selectedFields.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-900">
                Please select fields in Step 2 before adding filters
              </p>
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
              Use AND to make filters more restrictive (all conditions must match).
              Use OR to make filters more inclusive (any condition can match).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
