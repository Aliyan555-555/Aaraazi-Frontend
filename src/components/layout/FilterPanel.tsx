/**
 * FilterPanel - Advanced filtering component
 * 
 * Features:
 * - Multiple filter types (select, multi-select, range, date)
 * - Active filter display
 * - Clear all filters
 * - Collapsible sections
 * - Filter count badges
 * 
 * Usage:
 * <FilterPanel
 *   filters={[
 *     {
 *       id: 'status',
 *       label: 'Status',
 *       type: 'multi-select',
 *       options: ['pending', 'active', 'completed'],
 *       value: ['pending', 'active']
 *     },
 *     {
 *       id: 'priceRange',
 *       label: 'Price Range',
 *       type: 'range',
 *       min: 0,
 *       max: 10000000,
 *       value: [0, 5000000]
 *     }
 *   ]}
 *   onFilterChange={handleFilterChange}
 *   onClearAll={handleClearAll}
 * />
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Search,
} from 'lucide-react';

export type FilterType = 'select' | 'multi-select' | 'range' | 'date-range' | 'search';

export interface FilterOption {
  label: string;
  value: string | number;
  count?: number; // Optional count for each option
}

export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[]; // For select/multi-select
  value?: any; // Current value
  min?: number; // For range
  max?: number; // For range
  placeholder?: string; // For search
  icon?: React.ReactNode;
}

export interface FilterPanelProps {
  filters: FilterConfig[];
  onFilterChange: (filterId: string, value: any) => void;
  onClearAll: () => void;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showActiveCount?: boolean;
  className?: string;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onClearAll,
  title = 'Filters',
  collapsible = true,
  defaultExpanded = true,
  showActiveCount = true,
  className = '',
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(filters.map((f) => f.id))
  );

  // Count active filters
  const activeFilterCount = filters.filter((f) => {
    if (Array.isArray(f.value)) {
      return f.value.length > 0;
    }
    return f.value !== undefined && f.value !== null && f.value !== '';
  }).length;

  // Toggle section
  const toggleSection = (filterId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  };

  // Render filter based on type
  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.count !== undefined && ` (${option.count})`}
              </option>
            ))}
          </select>
        );

      case 'multi-select':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={filter.value?.includes(option.value) || false}
                  onChange={(e) => {
                    const currentValues = filter.value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: any) => v !== option.value);
                    onFilterChange(filter.id, newValues);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex-1">{option.label}</span>
                {option.count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {option.count}
                  </Badge>
                )}
              </label>
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={filter.value?.[0] || filter.min || 0}
                onChange={(e) =>
                  onFilterChange(filter.id, [
                    Number(e.target.value),
                    filter.value?.[1] || filter.max || 0,
                  ])
                }
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                value={filter.value?.[1] || filter.max || 0}
                onChange={(e) =>
                  onFilterChange(filter.id, [
                    filter.value?.[0] || filter.min || 0,
                    Number(e.target.value),
                  ])
                }
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'date-range':
        return (
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={filter.value?.[0] || ''}
                onChange={(e) =>
                  onFilterChange(filter.id, [e.target.value, filter.value?.[1] || ''])
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={filter.value?.[1] || ''}
                onChange={(e) =>
                  onFilterChange(filter.id, [filter.value?.[0] || '', e.target.value])
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filter.value || ''}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
              placeholder={filter.placeholder || 'Search...'}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div
        className={`p-4 border-b border-gray-200 ${
          collapsible ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-medium text-[#030213]">{title}</h3>
            {showActiveCount && activeFilterCount > 0 && (
              <Badge variant="default" className="bg-blue-600">
                {activeFilterCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
                className="h-8"
              >
                Clear All
              </Button>
            )}
            {collapsible && (
              <div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {filters.map((filter) => (
            <div key={filter.id} className="p-4">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection(filter.id)}
              >
                <div className="flex items-center gap-2">
                  {filter.icon}
                  <span className="text-sm font-medium text-gray-700">
                    {filter.label}
                  </span>
                  {/* Active indicator */}
                  {((Array.isArray(filter.value) && filter.value.length > 0) ||
                    (!Array.isArray(filter.value) &&
                      filter.value !== undefined &&
                      filter.value !== null &&
                      filter.value !== '')) && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                {expandedSections.has(filter.id) ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>

              {expandedSections.has(filter.id) && (
                <div className="mt-2">{renderFilter(filter)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active Filters Display */}
      {isExpanded && activeFilterCount > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const hasValue =
                (Array.isArray(filter.value) && filter.value.length > 0) ||
                (!Array.isArray(filter.value) &&
                  filter.value !== undefined &&
                  filter.value !== null &&
                  filter.value !== '');

              if (!hasValue) return null;

              let displayValue = '';
              if (Array.isArray(filter.value)) {
                if (filter.type === 'range' || filter.type === 'date-range') {
                  displayValue = `${filter.value[0]} - ${filter.value[1]}`;
                } else {
                  displayValue = `${filter.value.length} selected`;
                }
              } else {
                displayValue = String(filter.value);
              }

              return (
                <Badge
                  key={filter.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <span className="text-xs">
                    {filter.label}: {displayValue}
                  </span>
                  <button
                    onClick={() =>
                      onFilterChange(
                        filter.id,
                        Array.isArray(filter.value) ? [] : ''
                      )
                    }
                    className="hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
