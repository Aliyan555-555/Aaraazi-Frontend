import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

// Types
interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface QuickFilter {
  id: string;
  label: string;
  type?: 'multi-select' | 'single-select' | 'toggle';
  options?: FilterOption[];
  value?: string | string[] | boolean;
  onChange?: (value: string | string[] | boolean) => void;
  multiple?: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface WorkspaceSearchBarProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;

  // Quick filters (Miller's Law: max 7)
  quickFilters?: QuickFilter[];

  // Sort
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;

  // Actions
  onClearAll?: () => void;

  // Styling
  className?: string;
}

export const WorkspaceSearchBar: React.FC<WorkspaceSearchBarProps> = ({
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  quickFilters = [],
  sortOptions,
  sortValue,
  onSortChange,
  onClearAll,
  className = '',
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sync with external changes
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  // Calculate active filter count
  const activeFilterCount = quickFilters.reduce((count, filter) => {
    if (Array.isArray(filter.value)) {
      return count + filter.value.length;
    }
    return count + (filter.value ? 1 : 0);
  }, 0);

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0 || searchValue.length > 0;

  // Handle clear search
  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <div className={`bg-white border-b p-4 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
            aria-label="Search"
          />
          {localSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        {quickFilters.map((filter) => {
          // Handle toggle filters differently
          if (filter.type === 'toggle') {
            return (
              <Button
                key={filter.id}
                variant={filter.value ? 'default' : 'outline'}
                size="default"
                onClick={() => filter.onChange?.(!filter.value)}
                className="gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {filter.label}
              </Button>
            );
          }

          // Handle multi-select and single-select filters
          return (
            <Popover key={filter.id}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {filter.label}
                  {(() => {
                    const count = Array.isArray(filter.value)
                      ? filter.value.length
                      : filter.value ? 1 : 0;
                    return count > 0 ? (
                      <Badge variant="default" className="ml-1 px-1.5 py-0.5" style={{ fontSize: 'var(--text-xs)' }}>
                        {count}
                      </Badge>
                    ) : null;
                  })()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-2">
                  <p className="font-medium mb-3" style={{ fontSize: 'var(--text-sm)' }}>{filter.label}</p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {filter.options?.map((option) => {
                      const isSelected = Array.isArray(filter.value)
                        ? filter.value.includes(option.value)
                        : filter.value === option.value;

                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (filter.multiple && Array.isArray(filter.value)) {
                              const newValue = isSelected
                                ? filter.value.filter((v) => v !== option.value)
                                : [...filter.value, option.value];
                              filter.onChange?.(newValue);
                            } else {
                              filter.onChange?.(isSelected ? '' : option.value);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${isSelected
                            ? 'bg-gray-100 font-medium'
                            : 'hover:bg-gray-50'
                            }`}
                          style={{ fontSize: 'var(--text-sm)' }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            {option.count !== undefined && (
                              <Badge variant="outline" className="ml-2" style={{ fontSize: 'var(--text-xs)' }}>
                                {option.count}
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}

        {/* Sort Dropdown */}
        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <Select value={sortValue} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear All Filters */}
        {hasActiveFilters && onClearAll && (
          <Button
            variant="ghost"
            size="default"
            onClick={onClearAll}
            className="gap-2 text-gray-600"
          >
            <X className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-gray-600" style={{ fontSize: 'var(--text-sm)' }}>Active filters:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {searchValue && (
              <Badge variant="outline" className="gap-1">
                Search: "{searchValue}"
                <button
                  onClick={handleClearSearch}
                  className="ml-1 hover:text-gray-900"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {quickFilters.map((filter) => {
              // Handle toggle filters
              if (filter.type === 'toggle' && filter.value) {
                return (
                  <Badge key={filter.id} variant="outline" className="gap-1">
                    {filter.label}
                    <button
                      onClick={() => filter.onChange?.(false)}
                      className="ml-1 hover:text-gray-900"
                      aria-label={`Remove ${filter.label} filter`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              }

              // Handle multi-select and single-select filters
              const values = Array.isArray(filter.value) ? filter.value : filter.value ? [filter.value] : [];
              return values.map((value) => {
                const option = filter.options?.find((o) => o.value === value);
                if (!option) return null;

                return (
                  <Badge key={`${filter.id}-${value}`} variant="outline" className="gap-1">
                    {filter.label}: {option.label}
                    <button
                      onClick={() => {
                        if (Array.isArray(filter.value)) {
                          filter.onChange?.(filter.value.filter((v) => v !== value));
                        } else {
                          filter.onChange?.('');
                        }
                      }}
                      className="ml-1 hover:text-gray-900"
                      aria-label={`Remove ${option.label} filter`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              });
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Display name for debugging
WorkspaceSearchBar.displayName = 'WorkspaceSearchBar';