/**
 * SellCyclesWorkspaceV4 Component
 * WORKSPACE V4: Built with WorkspacePageTemplate ✅
 * 
 * PURPOSE:
 * Complete sell cycles workspace using the template system.
 * Demonstrates property listing and sales management.
 * 
 * FEATURES:
 * - Grid view (primary) and Table view (secondary)
 * - Search and filtering by status, seller type, agent
 * - Sorting options
 * - Bulk actions (export, change status, delete)
 * - Quick actions (view, edit, publish, delete)
 * - Pagination
 * - Empty states
 * - Loading states
 * 
 * PHASE 4E: SHARING INTEGRATION ✅
 * - SharedCyclesFilter for filtering by sharing status
 * - Filter: All Cycles, My Cycles, Shared by Me, Shared with Me
 * - Shared cycle indicators and counts
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, Download, Upload, Home } from 'lucide-react';
import { User, SellCycle, Property } from '../../types';
import { WorkspacePageTemplate } from '../workspace/WorkspacePageTemplate';
import { SellCycleWorkspaceCard } from './SellCycleWorkspaceCard';
import { StatusBadge } from '../layout/StatusBadge'; // PHASE 5: Add StatusBadge import
import { Column, EmptyStatePresets } from '../workspace';
// [STUBBED] import { getSellCycles, updateSellCycle, deleteSellCycle } from '../../lib/sellCycle';
// [STUBBED] import { getProperties } from '../../lib/data';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';

// Phase 4E: Sharing filters
import { SharedCyclesFilter, useSharingFilters } from '../sharing/SharedCyclesFilter';

import { logger } from "../../lib/logger";

// ===== STUBS for removed prototype functions =====
const getSellCycles = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateSellCycle = (..._args: any[]): any => { /* stub - prototype function removed */ };
const deleteSellCycle = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getProperties = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====

// Helper function to format property address
const formatPropertyAddress = (address: any): string => {
  if (typeof address === 'string') return address;
  if (address && typeof address === 'object') {
    const parts = [address.street, address.area, address.city].filter(Boolean);
    return parts.join(', ') || 'Property';
  }
  return 'Property';
};

export interface SellCyclesWorkspaceProps {
  user: User;
  onNavigate: (section: string, id?: string) => void;
  onStartNew?: () => void;
  onEditCycle?: (cycle: SellCycle) => void;
}

/**
 * SellCyclesWorkspaceV4 - Complete workspace using template system
 */
export const SellCyclesWorkspace: React.FC<SellCyclesWorkspaceProps> = ({
  user,
  onNavigate,
  onStartNew,
  onEditCycle,
}) => {
  // State
  const [isLoading, setIsLoading] = useState(false);

  // Load sell cycles based on user role
  const allCycles = useMemo(() => {
    return getSellCycles(user.role === 'admin' ? undefined : user.id, user.role);
  }, [user.id, user.role]);

  // Load properties for reference
  const allProperties = useMemo(() => {
    return getProperties(user.role === 'admin' ? undefined : user.id, user.role);
  }, [user.id, user.role]);

  // Helper to get property for a cycle
  const getProperty = (propertyId: string): Property | null => {
    return allProperties.find(p => p.id === propertyId) || null;
  };

  // Phase 4E: Sharing filters
  const {
    sharingFilter,
    setSharingFilter,
    selectedAgent,
    setSelectedAgent,
    applyFilters,
  } = useSharingFilters();

  // Apply sharing filters
  const sharingFilteredCycles = useMemo(() => {
    return applyFilters(allCycles, user.id);
  }, [allCycles, user.id, sharingFilter, selectedAgent]);

  // Calculate sharing stats
  const sharingStats = useMemo(() => {
    const sharedByMe = allCycles.filter(c => 
      c.agentId === user.id && c.sharing?.isShared === true
    ).length;
    const sharedWithMe = allCycles.filter(c => c.agentId !== user.id).length;
    const myCycles = allCycles.filter(c => c.agentId === user.id).length;

    return {
      sharedByMeCount: sharedByMe,
      sharedWithMeCount: sharedWithMe,
      myCyclesCount: myCycles,
      totalCount: allCycles.length,
    };
  }, [allCycles, user.id]);

  // Get available agents for filter
  const availableAgents = useMemo(() => {
    const agentMap = new Map<string, string>();
    allCycles.forEach(c => {
      if (c.agentId !== user.id) {
        agentMap.set(c.agentId, c.agentName || 'Unknown Agent');
      }
    });
    return Array.from(agentMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allCycles, user.id]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = sharingFilteredCycles.filter(c => 
      ['listed', 'offer-received', 'under-contract'].includes(c.status)
    ).length;
    const sold = sharingFilteredCycles.filter(c => c.status === 'sold').length;
    const withOffers = sharingFilteredCycles.filter(c => c.offers?.length > 0).length;
    
    const totalValue = sharingFilteredCycles
      .filter(c => ['listed', 'offer-received', 'under-contract'].includes(c.status))
      .reduce((sum, c) => sum + c.askingPrice, 0);
    
    return [
      { label: 'Total', value: sharingFilteredCycles.length, variant: 'default' as const },
      { label: 'Active', value: active, variant: 'success' as const },
      { label: 'Sold', value: sold, variant: 'info' as const },
      { 
        label: 'Total Value', 
        value: formatPKR(totalValue).replace('PKR ', ''), 
        variant: 'default' as const 
      },
    ];
  }, [sharingFilteredCycles]);

  // Define table columns
  const columns: Column<SellCycle>[] = [
    {
      id: 'property',
      label: 'Property',
      accessor: (c) => {
        const property = getProperty(c.propertyId);
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              {c.images?.[0] || property?.images?.[0] ? (
                <img 
                  src={c.images?.[0] || property?.images?.[0]} 
                  alt={property?.address || c.title} 
                  className="w-full h-full object-cover rounded" 
                />
              ) : (
                <Home className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {formatPropertyAddress(property?.address || c.title || 'Property')}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {property?.propertyType || 'N/A'}
              </div>
            </div>
          </div>
        );
      },
      width: '300px',
      sortable: true,
    },
    {
      id: 'askingPrice',
      label: 'Asking Price',
      accessor: (c) => (
        <div className="text-sm font-medium text-gray-900">
          {formatPKR(c.askingPrice)}
        </div>
      ),
      width: '150px',
      sortable: true,
    },
    {
      id: 'seller',
      label: 'Seller',
      accessor: (c) => (
        <div>
          <div className="text-sm text-gray-900">{c.sellerName}</div>
          <div className="text-xs text-gray-500 capitalize">{c.sellerType}</div>
        </div>
      ),
      width: '150px',
    },
    {
      id: 'agent',
      label: 'Agent',
      accessor: (c) => (
        <div className="text-sm text-gray-900">{c.agentName}</div>
      ),
      width: '130px',
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (c) => {
        const statusLabels: Record<string, string> = {
          listed: 'Listed',
          'offer-received': 'Offer Received',
          'under-contract': 'Under Contract',
          'sold-pending': 'Sold (Pending)',
          sold: 'Sold',
          expired: 'Expired',
          withdrawn: 'Withdrawn',
        };
        
        const statusLabel = statusLabels[c.status] || c.status;
        
        // PHASE 5: Use StatusBadge component with auto-mapping
        return <StatusBadge status={statusLabel} size="sm" />;
      },
      width: '140px',
      sortable: true,
    },
    {
      id: 'offers',
      label: 'Offers',
      accessor: (c) => (
        <div className="text-sm text-gray-900">
          {c.offers?.length || 0}
        </div>
      ),
      width: '80px',
    },
    {
      id: 'listedDate',
      label: 'Listed Date',
      accessor: (c) => (
        <div className="text-sm text-gray-900">
          {new Date(c.listedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      ),
      width: '120px',
      sortable: true,
    },
  ];

  // Define quick filters
  const quickFilters = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'listed', label: 'Listed', count: allCycles.filter(c => c.status === 'listed').length },
        { value: 'offer-received', label: 'Offer Received', count: allCycles.filter(c => c.status === 'offer-received').length },
        { value: 'under-contract', label: 'Under Contract', count: allCycles.filter(c => c.status === 'under-contract').length },
        { value: 'sold-pending', label: 'Sold (Pending)', count: allCycles.filter(c => c.status === 'sold-pending').length },
        { value: 'sold', label: 'Sold', count: allCycles.filter(c => c.status === 'sold').length },
        { value: 'expired', label: 'Expired', count: allCycles.filter(c => c.status === 'expired').length },
        { value: 'withdrawn', label: 'Withdrawn', count: allCycles.filter(c => c.status === 'withdrawn').length },
      ],
      multiple: true,
    },
    {
      id: 'sellerType',
      label: 'Seller Type',
      options: [
        { value: 'agency', label: 'Agency', count: allCycles.filter(c => c.sellerType === 'agency').length },
        { value: 'client', label: 'Client', count: allCycles.filter(c => c.sellerType === 'client').length },
        { value: 'investor', label: 'Investor', count: allCycles.filter(c => c.sellerType === 'investor').length },
      ],
      multiple: true,
    },
    {
      id: 'published',
      label: 'Published',
      options: [
        { value: 'yes', label: 'Published', count: allCycles.filter(c => c.isPublished).length },
        { value: 'no', label: 'Not Published', count: allCycles.filter(c => !c.isPublished).length },
      ],
      multiple: false,
    },
    {
      id: 'hasOffers',
      label: 'Has Offers',
      options: [
        { value: 'yes', label: 'With Offers', count: allCycles.filter(c => c.offers?.length > 0).length },
        { value: 'no', label: 'No Offers', count: allCycles.filter(c => !c.offers?.length).length },
      ],
      multiple: false,
    },
  ];

  // Define sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'offers', label: 'Most Offers' },
  ];

  // Define bulk actions
  const bulkActions = [
    {
      id: 'export',
      label: 'Export Selected',
      icon: <Download className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        const selected = allCycles.filter(c => ids.includes(c.id));
        logger.log('Exporting cycles:', selected);
        toast.success(`Exporting ${ids.length} cycle${ids.length > 1 ? 's' : ''}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        logger.log('Delete cycles:', ids);
        toast.success(`${ids.length} cycle${ids.length > 1 ? 's' : ''} deleted`);
      },
      variant: 'destructive' as const,
    },
  ];

  // Custom filter function
  const handleFilter = (cycle: SellCycle, filterValues: Record<string, any>): boolean => {
    // Status filter
    if (filterValues.status?.length > 0 && !filterValues.status.includes(cycle.status)) {
      return false;
    }

    // Seller type filter
    if (filterValues.sellerType?.length > 0 && !filterValues.sellerType.includes(cycle.sellerType)) {
      return false;
    }

    // Published filter
    if (filterValues.published) {
      if (filterValues.published === 'yes' && !cycle.isPublished) return false;
      if (filterValues.published === 'no' && cycle.isPublished) return false;
    }

    // Has offers filter
    if (filterValues.hasOffers) {
      const hasOffers = cycle.offers?.length > 0;
      if (filterValues.hasOffers === 'yes' && !hasOffers) return false;
      if (filterValues.hasOffers === 'no' && hasOffers) return false;
    }

    return true;
  };

  // Custom sort function
  const handleSort = (cycles: SellCycle[], sortBy: string): SellCycle[] => {
    const sorted = [...cycles];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.listedDate).getTime() - new Date(b.listedDate).getTime());
        break;
      case 'price-high':
        sorted.sort((a, b) => b.askingPrice - a.askingPrice);
        break;
      case 'price-low':
        sorted.sort((a, b) => a.askingPrice - b.askingPrice);
        break;
      case 'offers':
        sorted.sort((a, b) => (b.offers?.length || 0) - (a.offers?.length || 0));
        break;
      default:
        break;
    }
    
    return sorted;
  };

  // Custom search function
  const handleSearch = (cycle: SellCycle, query: string): boolean => {
    const property = getProperty(cycle.propertyId);
    const searchLower = query.toLowerCase();
    
    return (
      cycle.sellerName.toLowerCase().includes(searchLower) ||
      cycle.agentName.toLowerCase().includes(searchLower) ||
      cycle.title?.toLowerCase().includes(searchLower) ||
      formatPropertyAddress(property?.address).toLowerCase().includes(searchLower) ||
      property?.propertyType?.toLowerCase().includes(searchLower) ||
      cycle.askingPrice.toString().includes(searchLower)
    );
  };

  return (
    <WorkspacePageTemplate
      // Header
      title="Sell Cycles"
      description="Manage property listings and sales processes"
      stats={stats}
      
      // Primary action
      primaryAction={{
        label: 'Start Sell Cycle',
        icon: <Plus className="w-4 h-4" />,
        onClick: onStartNew || (() => toast.info('Start Sell Cycle clicked')),
      }}
      
      // Secondary actions
      secondaryActions={[
        {
          label: 'Import',
          icon: <Upload className="w-4 h-4" />,
          onClick: () => toast.info('Import clicked'),
        },
        {
          label: 'Export All',
          icon: <Download className="w-4 h-4" />,
          onClick: () => toast.info('Export All clicked'),
        },
      ]}
      
      // View configuration
      defaultView="grid"
      availableViews={['grid', 'table']}
      
      // Data
      items={sharingFilteredCycles}
      getItemId={(cycle) => cycle.id}
      
      // Table view
      columns={columns}
      
      // Grid view
      renderCard={(cycle) => (
        <SellCycleWorkspaceCard
          cycle={cycle}
          property={getProperty(cycle.propertyId)}
          onClick={() => onNavigate('sell-cycle-details', cycle.id)}
          onEdit={() => onEditCycle?.(cycle)}
          onPublish={() => toast.info(`Publish cycle ${cycle.id}`)}
          onDelete={() => toast.info(`Delete cycle ${cycle.id}`)}
        />
      )}
      
      // Search & Filter
      searchPlaceholder="Search by property, seller, agent..."
      onSearch={handleSearch}
      quickFilters={quickFilters}
      onFilter={handleFilter}
      sortOptions={sortOptions}
      onSort={handleSort}
      defaultSort="newest"
      
      // Bulk actions
      bulkActions={bulkActions}
      enableBulkSelect={true}
      
      // Item actions
      onItemClick={(cycle) => onNavigate('sell-cycle-details', cycle.id)}
      
      // Empty states
      emptyState={EmptyStatePresets.sellCycles(onStartNew || (() => {}))}
      
      // Loading
      isLoading={isLoading}
      
      // Pagination
      enablePagination={true}
      itemsPerPage={12}
    >
      <SharedCyclesFilter
        currentFilter={sharingFilter}
        onFilterChange={setSharingFilter}
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
        availableAgents={availableAgents}
        sharedByMeCount={sharingStats.sharedByMeCount}
        sharedWithMeCount={sharingStats.sharedWithMeCount}
        totalCount={sharingStats.totalCount}
      />
    </WorkspacePageTemplate>
  );
};