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

import React, { useMemo, useCallback } from 'react';
import { Plus, Trash2, Download, Upload, Home } from 'lucide-react';
import type { User, SellCycle, Property } from '../../types';
import { WorkspacePageTemplate } from '../workspace/WorkspacePageTemplate';
import { SellCycleWorkspaceCard } from './SellCycleWorkspaceCard';
import { StatusBadge } from '../layout/StatusBadge';
import { Column, EmptyStatePresets } from '../workspace';
<<<<<<< Updated upstream:src/components/sell-cycles/SellCyclesWorkspaceV4.tsx
import { getSellCycles, updateSellCycle, deleteSellCycle } from '../../lib/sellCycle';
import { getProperties } from '../../lib/data';
=======
>>>>>>> Stashed changes:src/components/sell-cycles/SellCyclesWorkspace.tsx
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { useSharingFilters } from '../sharing/SharedCyclesFilter';
import { useSellCycles } from '@/hooks/useSellCycles';
import { useProperties } from '@/hooks/useProperties';
import { logger } from '@/lib/logger';

<<<<<<< Updated upstream:src/components/sell-cycles/SellCyclesWorkspaceV4.tsx
// Phase 4E: Sharing filters
import { SharedCyclesFilter, useSharingFilters } from '../sharing/SharedCyclesFilter';
=======
function mapApiCycleToSellCycle(api: {
  id: string;
  cycleNumber: string;
  propertyListingId: string;
  agentId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  askingPrice: string;
  currentOfferPrice: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  agent?: { id: string; name: string; email: string };
}): SellCycle {
  const statusMap: Record<string, string> = {
    ACTIVE: 'listed',
    PENDING: 'pending',
    COMPLETED: 'sold',
    CANCELLED: 'cancelled',
    ON_HOLD: 'on-hold',
  };
  return {
    id: api.id,
    propertyId: api.propertyListingId,
    agentId: api.agentId,
    agentName: api.agent?.name,
    status: (statusMap[api.status] || api.status.toLowerCase()) as SellCycle['status'],
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    createdBy: api.createdBy ?? api.agentId,
    sellerType: 'client',
    sellerId: '',
    sellerName: '',
    askingPrice: Number(api.askingPrice) || 0,
    commissionRate: 0,
    commissionType: 'percentage',
    title: `Sell cycle ${api.cycleNumber}`,
    listedDate: api.startDate,
    offers: [],
    sharedWith: [],
  };
}
>>>>>>> Stashed changes:src/components/sell-cycles/SellCyclesWorkspace.tsx

// Helper function to format property address
const formatPropertyAddress = (address: any): string => {
  if (typeof address === 'string') return address;
  if (address && typeof address === 'object') {
    const parts = [address.street, address.area, address.city].filter(Boolean);
    return parts.join(', ') || 'Property';
  }
  return 'Property';
};

export interface SellCyclesWorkspaceV4Props {
  user: User;
  onNavigate: (section: string, id?: string) => void;
  onStartNew?: () => void;
  onEditCycle?: (cycle: SellCycle) => void;
}

/**
 * SellCyclesWorkspaceV4 - Complete workspace using template system
 */
export const SellCyclesWorkspaceV4: React.FC<SellCyclesWorkspaceV4Props> = ({
  user,
  onNavigate,
  onStartNew,
  onEditCycle,
}) => {
  const { data: cyclesData, isLoading } = useSellCycles();
  const { properties: allProperties } = useProperties();

  const allCycles = useMemo(() => {
    const list = cyclesData?.items ?? [];
    return list.map(mapApiCycleToSellCycle);
  }, [cyclesData?.items]);

  const getProperty = useCallback((propertyId: string): Property | undefined => {
    return allProperties.find((p) => p.id === propertyId);
  }, [allProperties]);

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
        { value: 'sold-pending', label: 'Sold (Pending)', count: allCycles.filter(c => (c as { status: string }).status === 'sold-pending').length },
        { value: 'sold', label: 'Sold', count: allCycles.filter(c => c.status === 'sold').length },
        { value: 'expired', label: 'Expired', count: allCycles.filter(c => (c as { status: string }).status === 'expired').length },
        { value: 'withdrawn', label: 'Withdrawn', count: allCycles.filter(c => (c as { status: string }).status === 'withdrawn').length },
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
        console.log('Exporting cycles:', selected);
        toast.success(`Exporting ${ids.length} cycle${ids.length > 1 ? 's' : ''}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        console.log('Delete cycles:', ids);
        toast.success(`${ids.length} cycle${ids.length > 1 ? 's' : ''} deleted`);
      },
      variant: 'destructive' as const,
    },
  ];

  // Custom filter function (WorkspacePageTemplate passes activeFilters as Map)
  const handleFilter = useCallback((cycle: SellCycle, activeFilters: Map<string, any>): boolean => {
    const status = activeFilters.get('status');
    if (Array.isArray(status) && status.length > 0 && !status.includes(cycle.status)) return false;

    const sellerType = activeFilters.get('sellerType');
    if (Array.isArray(sellerType) && sellerType.length > 0 && !sellerType.includes(cycle.sellerType)) return false;

    const published = activeFilters.get('published');
    const isPublished = (cycle as { isPublished?: boolean }).isPublished;
    if (published === 'yes' && !isPublished) return false;
    if (published === 'no' && isPublished) return false;

    const hasOffers = activeFilters.get('hasOffers');
    const hasOffersCount = cycle.offers?.length > 0;
    if (hasOffers === 'yes' && !hasOffersCount) return false;
    if (hasOffers === 'no' && hasOffersCount) return false;

    return true;
  }, []);

  // Custom sort function (template passes sortBy and sortOrder)
  const handleSort = useCallback((cycles: SellCycle[], sortBy: string, _order?: 'asc' | 'desc'): SellCycle[] => {
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
  }, []);

  // Custom search function
  const handleSearch = useCallback((cycle: SellCycle, query: string): boolean => {
    const property = getProperty(cycle.propertyId);
    const searchLower = query.toLowerCase();
    return (
      (cycle.sellerName ?? '').toLowerCase().includes(searchLower) ||
      (cycle.agentName ?? '').toLowerCase().includes(searchLower) ||
      (cycle.title ?? '').toLowerCase().includes(searchLower) ||
      formatPropertyAddress(property?.address).toLowerCase().includes(searchLower) ||
      (property?.propertyType ?? '').toLowerCase().includes(searchLower) ||
      String(cycle.askingPrice ?? '').includes(searchLower)
    );
  }, [getProperty]);

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
      
      // Bulk actions
      bulkActions={bulkActions}
      
      // Item actions
      onItemClick={(cycle) => onNavigate('sell-cycle-details', cycle.id)}
      
      // Empty states
      emptyStatePreset={EmptyStatePresets.sellCycles(onStartNew ?? (() => {}))}
      
      // Loading
      isLoading={isLoading}
      
      // Pagination
      pagination={{ enabled: true, pageSize: 12, pageSizeOptions: [12, 24, 48] }}
    />
  );
};