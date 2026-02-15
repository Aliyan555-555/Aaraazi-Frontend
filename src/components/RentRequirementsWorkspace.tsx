/**
 * Rent Requirements Workspace
 * PHASE 4: Updated with new workspace components ✅
 */

import React, { useState, useEffect, useMemo } from 'react';
import { RentRequirement, User } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Users,
  Download,
  Upload,
  Eye,
  MapPin,
  Home,
  CheckCircle,
} from 'lucide-react';
// [STUBBED] import { getRentRequirements } from '../lib/rentRequirements';
import { formatPKR } from '../lib/currency';

import { logger } from "../lib/logger";
// PHASE 4: Import new workspace components ✅
import {
  WorkspaceHeader,
  WorkspaceSearchBar,
  WorkspaceEmptyState,
  EmptyStatePresets,
} from './workspace';

// ===== STUBS for removed prototype functions =====
const getRentRequirements = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface RentRequirementsWorkspaceProps {
  user: User;
  onViewDetails?: (requirement: RentRequirement) => void;
  onAddNew?: () => void;
}

export function RentRequirementsWorkspace({
  user,
  onViewDetails,
  onAddNew,
}: RentRequirementsWorkspaceProps) {
  const [requirements, setRequirements] = useState<RentRequirement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');

  // Load data
  useEffect(() => {
    const allRequirements = getRentRequirements(user.id, user.role);
    setRequirements(allRequirements);
  }, [user.id, user.role]);

  // Filtered and sorted requirements
  const filteredRequirements = useMemo(() => {
    let result = [...requirements];

    // Search filter
    if (searchQuery) {
      result = result.filter(r =>
        r.renterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.preferredAreas?.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (selectedStatus.length > 0) {
      result = result.filter(r => selectedStatus.includes(r.status));
    }

    // Type filter
    if (selectedType.length > 0) {
      result = result.filter(r => 
        r.propertyType?.some(type => selectedType.includes(type))
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case 'budget-high':
        result.sort((a, b) => (b.budgetMax || 0) - (a.budgetMax || 0));
        break;
      case 'budget-low':
        result.sort((a, b) => (a.budgetMax || 0) - (b.budgetMax || 0));
        break;
    }

    return result;
  }, [requirements, searchQuery, selectedStatus, selectedType, sortBy]);

  // Stats calculation
  const stats = useMemo(() => {
    return [
      {
        label: 'Total',
        value: requirements.length,
        variant: 'default' as const,
      },
      {
        label: 'Active',
        value: requirements.filter(r => r.status === 'active').length,
        variant: 'success' as const,
      },
      {
        label: 'Matched',
        value: requirements.filter(r => r.status === 'matched').length,
        variant: 'warning' as const,
      },
      {
        label: 'Converted',
        value: requirements.filter(r => r.status === 'converted').length,
        variant: 'info' as const,
      },
    ];
  }, [requirements]);

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'active': 'default',
      'matched': 'secondary',
      'viewing-scheduled': 'secondary',
      'converted': 'outline',
      'closed': 'outline',
    };
    return variants[status] || 'default';
  };

  // Handlers
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus([]);
    setSelectedType([]);
    setSortBy('newest');
  };

  const handleExport = () => {
    logger.log('Export rent requirements');
  };

  const handleImport = () => {
    logger.log('Import rent requirements');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PHASE 4: New WorkspaceHeader ✅ */}
      <WorkspaceHeader
        title="Rent Requirements"
        description="Track and match tenant requirements with properties"
        stats={stats}
        primaryAction={onAddNew ? {
          label: 'Add Tenant Requirement',
          icon: <Users className="w-4 h-4" />,
          onClick: onAddNew,
        } : undefined}
        secondaryActions={[
          {
            label: 'Export to CSV',
            icon: <Download className="w-4 h-4" />,
            onClick: handleExport,
          },
          {
            label: 'Import Requirements',
            icon: <Upload className="w-4 h-4" />,
            onClick: handleImport,
          },
        ]}
      />

      {/* PHASE 4: New WorkspaceSearchBar ✅ */}
      <WorkspaceSearchBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by tenant name or location..."
        quickFilters={[
          {
            id: 'status',
            label: 'Status',
            options: [
              {
                value: 'active',
                label: 'Active',
                count: requirements.filter(r => r.status === 'active').length,
              },
              {
                value: 'matched',
                label: 'Matched',
                count: requirements.filter(r => r.status === 'matched').length,
              },
              {
                value: 'viewing-scheduled',
                label: 'Viewing Scheduled',
                count: requirements.filter(r => r.status === 'viewing-scheduled').length,
              },
              {
                value: 'converted',
                label: 'Converted',
                count: requirements.filter(r => r.status === 'converted').length,
              },
              {
                value: 'closed',
                label: 'Closed',
                count: requirements.filter(r => r.status === 'closed').length,
              },
            ],
            value: selectedStatus,
            onChange: (value) => setSelectedStatus(Array.isArray(value) ? value : []),
            multiple: true,
          },
          {
            id: 'type',
            label: 'Property Type',
            options: [
              {
                value: 'house',
                label: 'House',
                count: requirements.filter(r => r.propertyType?.includes('house')).length,
              },
              {
                value: 'apartment',
                label: 'Apartment',
                count: requirements.filter(r => r.propertyType?.includes('apartment')).length,
              },
              {
                value: 'commercial',
                label: 'Commercial',
                count: requirements.filter(r => r.propertyType?.includes('commercial')).length,
              },
            ],
            value: selectedType,
            onChange: (value) => setSelectedType(Array.isArray(value) ? value : []),
            multiple: true,
          },
        ]}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'budget-high', label: 'Budget: High to Low' },
          { value: 'budget-low', label: 'Budget: Low to High' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        onClearAll={handleClearFilters}
      />

      {/* Content Area */}
      <div className="p-6">
        {filteredRequirements.length === 0 ? (
          // PHASE 4: New WorkspaceEmptyState ✅
          requirements.length === 0 ? (
            <WorkspaceEmptyState
              {...EmptyStatePresets.requirements(onAddNew || (() => {}), 'rent')}
            />
          ) : (
            <WorkspaceEmptyState
              {...EmptyStatePresets.noResults(handleClearFilters)}
            />
          )
        ) : (
          // Requirements List
          <div className="space-y-4">
            {filteredRequirements.map(requirement => (
              <Card
                key={requirement.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewDetails && onViewDetails(requirement)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left: Tenant Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{requirement.renterName}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {requirement.preferredAreas && requirement.preferredAreas.length > 0 
                              ? requirement.preferredAreas.join(', ') 
                              : 'Any location'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-600">Property Type</p>
                          <p className="text-sm flex items-center gap-1 capitalize">
                            <Home className="w-3 h-3" />
                            {requirement.propertyType && requirement.propertyType.length > 0
                              ? requirement.propertyType.join(', ')
                              : 'Any'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Budget Range</p>
                          <p className="text-sm">
                            {formatPKR(requirement.budgetMin || 0)} - {formatPKR(requirement.budgetMax || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Matches</p>
                          <p className="text-sm flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {requirement.matchedProperties?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="text-right">
                      <Badge variant={getStatusBadge(requirement.status)} className="capitalize mb-4">
                        {requirement.status.replace(/-/g, ' ')}
                      </Badge>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onViewDetails && onViewDetails(requirement);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
