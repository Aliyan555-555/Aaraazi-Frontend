/**
 * SharedCyclesFilter Component
 * Filter component for shared cycles in workspaces
 * 
 * Features:
 * - Filter by sharing status (My Cycles, Shared By Me, Shared With Me)
 * - Filter by shared agent
 * - Filter by sharing date range
 * - Quick filters for common scenarios
 */

import React from 'react';
import {
  Users,
  Share2,
  UserCheck,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
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

export type SharingFilterType = 'all' | 'my-cycles' | 'shared-by-me' | 'shared-with-me';

interface SharedCyclesFilterProps {
  currentFilter: SharingFilterType;
  onFilterChange: (filter: SharingFilterType) => void;
  sharedByMeCount?: number;
  sharedWithMeCount?: number;
  totalCount?: number;
  availableAgents?: Array<{ id: string; name: string }>;
  selectedAgent?: string;
  onAgentChange?: (agentId: string) => void;
  className?: string;
}

export const SharedCyclesFilter: React.FC<SharedCyclesFilterProps> = ({
  currentFilter,
  onFilterChange,
  sharedByMeCount = 0,
  sharedWithMeCount = 0,
  totalCount = 0,
  availableAgents = [],
  selectedAgent,
  onAgentChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Filter options with counts
  const filterOptions = [
    {
      value: 'all' as SharingFilterType,
      label: 'All Cycles',
      icon: <Users className="h-4 w-4" />,
      count: totalCount,
      description: 'All cycles you can access',
    },
    {
      value: 'my-cycles' as SharingFilterType,
      label: 'My Cycles',
      icon: <UserCheck className="h-4 w-4" />,
      count: totalCount - sharedWithMeCount,
      description: 'Cycles you own',
    },
    {
      value: 'shared-by-me' as SharingFilterType,
      label: 'Shared by Me',
      icon: <Share2 className="h-4 w-4" />,
      count: sharedByMeCount,
      description: 'Your cycles shared with others',
    },
    {
      value: 'shared-with-me' as SharingFilterType,
      label: 'Shared with Me',
      icon: <Users className="h-4 w-4" />,
      count: sharedWithMeCount,
      description: 'Cycles others shared with you',
    },
  ];

  // Get current filter option
  const currentOption = filterOptions.find(opt => opt.value === currentFilter);

  // Get active filter count
  const activeFilterCount = (currentFilter !== 'all' ? 1 : 0) + (selectedAgent ? 1 : 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main Filter Dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 relative"
          >
            {currentOption?.icon}
            <span className="hidden sm:inline">{currentOption?.label}</span>
            <span className="sm:hidden">Filter</span>
            {activeFilterCount > 0 && (
              <Badge 
                variant="default" 
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-[#2D6A54] text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
            <Filter className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-[#1A1F1F] mb-3">
              Filter Shared Cycles
            </h4>
            
            {/* Filter Options */}
            <div className="space-y-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onFilterChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    currentFilter === option.value
                      ? 'bg-[#2D6A54] text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={currentFilter === option.value ? 'text-white' : 'text-gray-600'}>
                      {option.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        currentFilter === option.value ? 'text-white' : 'text-[#1A1F1F]'
                      }`}>
                        {option.label}
                      </p>
                      <p className={`text-xs ${
                        currentFilter === option.value ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={currentFilter === option.value ? 'secondary' : 'outline'}
                    className={`${
                      currentFilter === option.value 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'bg-white'
                    }`}
                  >
                    {option.count}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Agent Filter */}
            {availableAgents.length > 0 && currentFilter === 'shared-with-me' && (
              <div className="pt-3 mt-3 border-t">
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Filter by Agent
                </label>
                <Select value={selectedAgent} onValueChange={onAgentChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All agents</SelectItem>
                    {availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          {currentFilter !== 'all' && (
            <Badge
              variant="outline"
              className="gap-1 pr-1"
            >
              {currentOption?.label}
              <button
                onClick={() => onFilterChange('all')}
                className="ml-1 hover:bg-gray-200 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedAgent && selectedAgent !== 'all' && onAgentChange && (
            <Badge
              variant="outline"
              className="gap-1 pr-1"
            >
              {availableAgents.find(a => a.id === selectedAgent)?.name || 'Agent'}
              <button
                onClick={() => onAgentChange('all')}
                className="ml-1 hover:bg-gray-200 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Clear All */}
          {activeFilterCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onFilterChange('all');
                if (onAgentChange) onAgentChange('all');
              }}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Helper hook for managing sharing filters
 */
export function useSharingFilters() {
  const [sharingFilter, setSharingFilter] = React.useState<SharingFilterType>('all');
  const [selectedAgent, setSelectedAgent] = React.useState<string>('all');

  const applyFilters = <T extends { agentId: string; sharing?: any }>(cycles: T[], currentUserId: string): T[] => {
    let filtered = cycles;

    // Apply sharing filter
    switch (sharingFilter) {
      case 'my-cycles':
        filtered = filtered.filter(c => c.agentId === currentUserId);
        break;
      case 'shared-by-me':
        filtered = filtered.filter(c => 
          c.agentId === currentUserId && 
          c.sharing?.isShared === true
        );
        break;
      case 'shared-with-me':
        filtered = filtered.filter(c => 
          c.agentId !== currentUserId
        );
        break;
      // 'all' - no filtering
    }

    // Apply agent filter
    if (selectedAgent && selectedAgent !== 'all') {
      filtered = filtered.filter(c => c.agentId === selectedAgent);
    }

    return filtered;
  };

  const resetFilters = () => {
    setSharingFilter('all');
    setSelectedAgent('all');
  };

  return {
    sharingFilter,
    setSharingFilter,
    selectedAgent,
    setSelectedAgent,
    applyFilters,
    resetFilters,
  };
}
