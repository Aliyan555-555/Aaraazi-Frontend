/**
 * FilterPanel - Advanced filtering component
 * 
 * Features:
 * - Multiple filter types (select, multi-select, date-range, number-range, text)
 * - Collapsible sections
 * - Active filter display
 * - Clear all button
 * - Apply/Reset actions
 * - Responsive
 * 
 * Usage:
 * <FilterPanel
 *   filters={filterDefinitions}
 *   values={filterValues}
 *   onChange={setFilterValues}
 *   onClear={clearFilters}
 * />
 */

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';
import { Label } from './label';
import { Input } from './input';
import { Checkbox } from './checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';

export type FilterType = 
  | 'select' 
  | 'multi-select' 
  | 'date-range' 
  | 'number-range' 
  | 'text'
  | 'checkbox';

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterDefinition {
  id: string;
  type: FilterType;
  label: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: any;
}

export interface FilterPanelProps {
  filters: FilterDefinition[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onClear?: () => void;
  onApply?: () => void;
  showApplyButton?: boolean;
  className?: string;
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onClear,
  onApply,
  showApplyButton = false,
  className = '',
}: FilterPanelProps) {
  // Update a single filter value
  const updateFilter = (filterId: string, value: any) => {
    onChange({
      ...values,
      [filterId]: value,
    });
  };

  // Remove a single filter
  const removeFilter = (filterId: string) => {
    const newValues = { ...values };
    delete newValues[filterId];
    onChange(newValues);
  };

  // Count active filters
  const activeFilterCount = Object.keys(values).filter(
    (key) => values[key] !== undefined && values[key] !== null && values[key] !== ''
  ).length;

  // Render filter input based on type
  const renderFilterInput = (filter: FilterDefinition) => {
    const currentValue = values[filter.id];

    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={currentValue || ''}
            onValueChange={(value) => updateFilter(filter.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi-select':
        const selectedValues = currentValue || [];
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.id}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v: any) => v !== option.value);
                    updateFilter(filter.id, newValues);
                  }}
                />
                <Label
                  htmlFor={`${filter.id}-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'date-range':
        const dateRange = currentValue || { from: '', to: '' };
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-gray-600">From</Label>
              <Input
                type="date"
                value={dateRange.from || ''}
                onChange={(e) =>
                  updateFilter(filter.id, { ...dateRange, from: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">To</Label>
              <Input
                type="date"
                value={dateRange.to || ''}
                onChange={(e) =>
                  updateFilter(filter.id, { ...dateRange, to: e.target.value })
                }
              />
            </div>
          </div>
        );

      case 'number-range':
        const numberRange = currentValue || { min: filter.min || 0, max: filter.max || 0 };
        const formatValue = filter.format || ((v: number) => String(v));
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-gray-600">
                Min: {formatValue(numberRange.min || filter.min || 0)}
              </Label>
              <Input
                type="number"
                min={filter.min}
                max={filter.max}
                step={filter.step || 1}
                value={numberRange.min || ''}
                onChange={(e) =>
                  updateFilter(filter.id, {
                    ...numberRange,
                    min: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">
                Max: {formatValue(numberRange.max || filter.max || 0)}
              </Label>
              <Input
                type="number"
                min={filter.min}
                max={filter.max}
                step={filter.step || 1}
                value={numberRange.max || ''}
                onChange={(e) =>
                  updateFilter(filter.id, {
                    ...numberRange,
                    max: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <Input
            type="text"
            placeholder={filter.placeholder || 'Enter text...'}
            value={currentValue || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.id}
              checked={currentValue || false}
              onCheckedChange={(checked) => updateFilter(filter.id, checked)}
            />
            <Label htmlFor={filter.id} className="text-sm font-normal cursor-pointer">
              {filter.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[#030213]">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs text-gray-600 hover:text-[#030213]"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{filter.label}</Label>
              {values[filter.id] !== undefined &&
                values[filter.id] !== null &&
                values[filter.id] !== '' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="h-5 w-5 p-0 hover:bg-gray-100"
                    aria-label={`Clear ${filter.label} filter`}
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </Button>
                )}
            </div>
            {renderFilterInput(filter)}
          </div>
        ))}
      </div>

      {/* Apply button (optional) */}
      {showApplyButton && onApply && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button onClick={onApply} className="w-full">
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}
