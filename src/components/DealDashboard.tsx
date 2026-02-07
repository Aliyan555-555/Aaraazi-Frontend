/**
 * Deal Dashboard Component
 * PHASE 4: Updated with new workspace components ✅
 * FIXED: Updated to use new Deal type structure with nested fields
 * 
 * Main dashboard for viewing and managing all deals
 */

import React, { useState, useMemo } from 'react';
import { Deal, User } from '../types';
import { getDeals, getDealStageStats, getDealStatusStats } from '../lib/deals';
import { getProperties } from '../lib/data';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Eye,
  DollarSign,
  FileText,
  Calendar,
  Download,
  Upload,
  MapPin,
  Users,
} from 'lucide-react';
import { formatPKR } from '../lib/currency';

// PHASE 4: Import new workspace components ✅
import {
  WorkspaceHeader,
  WorkspaceSearchBar,
  WorkspaceEmptyState,
  EmptyStatePresets,
} from './workspace';

interface DealDashboardProps {
  user: User;
  onViewDeal?: (dealId: string) => void; // FIXED: Changed from Deal to dealId string
  onCreateDeal?: () => void;
}

export function DealDashboard({
  user,
  onViewDeal,
  onCreateDeal,
}: DealDashboardProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');

  // Load deals
  React.useEffect(() => {
    const allDeals = getDeals(user.id, user.role);
    console.log('📊 Loaded deals:', allDeals.length);
    console.log('First deal structure:', allDeals[0]);
    setDeals(allDeals);
  }, [user.id, user.role]);

  // Get properties for lookup
  const properties = useMemo(() => {
    const props = getProperties();
    return new Map(props.map(p => [p.id, p]));
  }, []);

  // Helper to get property title
  const getPropertyTitle = (deal: Deal): string => {
    if (deal.cycles.sellCycle) {
      const property = properties.get(deal.cycles.sellCycle.propertyId);
      return property?.title || property?.address || 'Unknown Property';
    }
    return 'External Property';
  };

  // Filtered and sorted deals
  const filteredDeals = useMemo(() => {
    let result = [...deals];

    // Search filter
    if (searchQuery) {
      result = result.filter(d => {
        const propertyTitle = getPropertyTitle(d).toLowerCase();
        const buyerName = d.parties.buyer.name.toLowerCase();
        const sellerName = d.parties.seller.name.toLowerCase();
        const dealNumber = d.dealNumber.toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return propertyTitle.includes(query) ||
               buyerName.includes(query) ||
               sellerName.includes(query) ||
               dealNumber.includes(query);
      });
    }

    // Stage filter
    if (selectedStage.length > 0) {
      result = result.filter(d => selectedStage.includes(d.lifecycle.stage));
    }

    // Status filter
    if (selectedStatus.length > 0) {
      result = result.filter(d => selectedStatus.includes(d.lifecycle.status));
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime());
        break;
      case 'value-high':
        result.sort((a, b) => b.financial.agreedPrice - a.financial.agreedPrice);
        break;
      case 'value-low':
        result.sort((a, b) => a.financial.agreedPrice - b.financial.agreedPrice);
        break;
    }

    return result;
  }, [deals, searchQuery, selectedStage, selectedStatus, sortBy, properties]);

  // Stats calculation
  const stats = useMemo(() => {
    const statusStats = getDealStatusStats(deals);
    
    return [
      { label: 'Total', value: deals.length, variant: 'default' as const },
      { label: 'In Progress', value: statusStats.active || 0, variant: 'warning' as const },
      { label: 'Completed', value: statusStats.completed || 0, variant: 'success' as const },
      { label: 'Cancelled', value: statusStats.cancelled || 0, variant: 'destructive' as const },
    ];
  }, [deals]);

  // Stage counts for filters
  const stageStats = useMemo(() => getDealStageStats(deals), [deals]);
  const statusStats = useMemo(() => getDealStatusStats(deals), [deals]);

  // Status badge helper
  const getStatusBadge = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      'active': 'default',
      'on-hold': 'outline',
      'completed': 'secondary',
      'cancelled': 'destructive',
    };
    return variants[status] || 'default';
  };

  // Stage label helper
  const getStageLabelMap = (stage: string): string => {
    const labels: Record<string, string> = {
      'offer-accepted': 'Offer Accepted',
      'agreement-signing': 'Agreement Signing',
      'documentation': 'Documentation',
      'payment-processing': 'Payment Processing',
      'handover-preparation': 'Handover Prep',
      'transfer-registration': 'Transfer Registration',
      'final-handover': 'Final Handover',
    };
    return labels[stage] || stage;
  };

  // Handlers
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStage([]);
    setSelectedStatus([]);
    setSortBy('newest');
  };

  const handleExport = () => {
    console.log('Export deals');
  };

  const handleImport = () => {
    console.log('Import deals');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* PHASE 4: New WorkspaceHeader ✅ */}
      <WorkspaceHeader
        title="Deal Management"
        description="Track and manage property deals"
        stats={stats}
        primaryAction={onCreateDeal ? {
          label: 'Create Deal',
          icon: <FileText className="w-4 h-4" />,
          onClick: onCreateDeal,
        } : undefined}
        secondaryActions={[
          {
            label: 'Export to CSV',
            icon: <Download className="w-4 h-4" />,
            onClick: handleExport,
          },
          {
            label: 'Import Deals',
            icon: <Upload className="w-4 h-4" />,
            onClick: handleImport,
          },
        ]}
      />

      {/* PHASE 4: New WorkspaceSearchBar ✅ */}
      <WorkspaceSearchBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by property, buyer, or seller..."
        quickFilters={[
          {
            id: 'stage',
            label: 'Stage',
            options: [
              { value: 'offer-accepted', label: 'Offer Accepted', count: stageStats['offer-accepted'] || 0 },
              { value: 'agreement-signing', label: 'Agreement Signing', count: stageStats['agreement-signing'] || 0 },
              { value: 'documentation', label: 'Documentation', count: stageStats['documentation'] || 0 },
              { value: 'payment-processing', label: 'Payment Processing', count: stageStats['payment-processing'] || 0 },
              { value: 'handover-preparation', label: 'Handover Prep', count: stageStats['handover-preparation'] || 0 },
              { value: 'transfer-registration', label: 'Transfer Registration', count: stageStats['transfer-registration'] || 0 },
              { value: 'final-handover', label: 'Final Handover', count: stageStats['final-handover'] || 0 },
            ],
            value: selectedStage,
            onChange: setSelectedStage,
            multiple: true,
          },
          {
            id: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active', count: statusStats.active || 0 },
              { value: 'on-hold', label: 'On Hold', count: statusStats['on-hold'] || 0 },
              { value: 'completed', label: 'Completed', count: statusStats.completed || 0 },
              { value: 'cancelled', label: 'Cancelled', count: statusStats.cancelled || 0 },
            ],
            value: selectedStatus,
            onChange: setSelectedStatus,
            multiple: true,
          },
        ]}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'value-high', label: 'Value: High to Low' },
          { value: 'value-low', label: 'Value: Low to High' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        onClearAll={handleClearFilters}
      />

      {/* Content Area */}
      <div className="p-6">
        {filteredDeals.length === 0 ? (
          // PHASE 4: New WorkspaceEmptyState ✅
          deals.length === 0 ? (
            <WorkspaceEmptyState
              {...EmptyStatePresets.deals(onCreateDeal || (() => {}))}
            />
          ) : (
            <WorkspaceEmptyState
              {...EmptyStatePresets.noResults(handleClearFilters)}
            />
          )
        ) : (
          // Deals List
          <div className="space-y-4">
            {filteredDeals.map(deal => (
              <Card
                key={deal.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewDeal && onViewDeal(deal.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left: Deal Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{getPropertyTitle(deal)}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {deal.dealNumber}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-600">Buyer</p>
                          <p className="text-sm flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {deal.parties.buyer.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Seller</p>
                          <p className="text-sm flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {deal.parties.seller.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Stage</p>
                          <p className="text-sm">{getStageLabelMap(deal.lifecycle.stage)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Status */}
                    <div className="text-right">
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">Deal Value</p>
                        <p className="text-xl font-medium flex items-center justify-end gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatPKR(deal.financial.agreedPrice)}
                        </p>
                      </div>
                      <Badge variant={getStatusBadge(deal.lifecycle.status)} className="capitalize">
                        {deal.lifecycle.status.replace(/-/g, ' ')}
                      </Badge>
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDeal && onViewDeal(deal.id);
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