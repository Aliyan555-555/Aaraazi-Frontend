/**
 * PurchaseCyclesWorkspaceV4 Component
 * WORKSPACE V4: Built with WorkspacePageTemplate ✅
 * 
 * PURPOSE:
 * Complete purchase cycles workspace using the template system.
 * Demonstrates property acquisition and buying management.
 * 
 * FEATURES:
 * - Grid view (primary) and Table view (secondary)
 * - Search and filtering by status, purchaser type, financing
 * - Sorting options
 * - Bulk actions (export, change status, delete)
 * - Quick actions (view, edit, delete)
 * - Pagination
 * - Empty states
 * - Loading states
 */

import React, { useMemo, useCallback } from 'react';
import { Plus, Trash2, Download, Upload, Home } from 'lucide-react';
import type { User, PurchaseCycle, Property } from '../../types';
import { WorkspacePageTemplate } from '../workspace/WorkspacePageTemplate';
import { PurchaseCycleWorkspaceCard } from './PurchaseCycleWorkspaceCard';
import { StatusBadge } from '../layout/StatusBadge';
import { Column, EmptyStatePresets } from '../workspace';
<<<<<<< Updated upstream:src/components/purchase-cycles/PurchaseCyclesWorkspaceV4.tsx
import { getPurchaseCycles, updatePurchaseCycle, deletePurchaseCycle } from '../../lib/purchaseCycle';
import { getProperties } from '../../lib/data';
=======
>>>>>>> Stashed changes:src/components/purchase-cycles/PurchaseCyclesWorkspace.tsx
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { logger } from '../../lib/logger';
import { usePurchaseCycles } from '@/hooks/usePurchaseCycles';
import { useProperties } from '@/hooks/useProperties';

<<<<<<< Updated upstream:src/components/purchase-cycles/PurchaseCyclesWorkspaceV4.tsx
=======
function mapApiToPurchaseCycle(api: {
  id: string;
  cycleNumber: string;
  requirementId: string;
  agentId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  requirement?: { id: string; contact?: { name: string } };
  agent?: { id: string; name: string; email: string };
}): PurchaseCycle {
  const statusMap: Record<string, string> = {
    ACTIVE: 'prospecting',
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    ON_HOLD: 'on-hold',
    NEGOTIATION: 'negotiation',
    UNDER_CONTRACT: 'under-contract',
  };
  return {
    id: api.id,
    propertyId: '',
    agentId: api.agentId,
    agentName: api.agent?.name,
    status: (statusMap[api.status] || api.status.toLowerCase()) as PurchaseCycle['status'],
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    createdBy: api.createdBy ?? api.agentId,
    title: `Purchase ${api.cycleNumber}`,
    buyerRequirementId: api.requirementId,
    purchaserName: api.requirement?.contact?.name ?? '',
    purchaserType: 'client',
    offerAmount: 0,
    negotiatedPrice: undefined,
    listedDate: api.startDate,
    offers: [],
    sharedWith: [],
  };
}

>>>>>>> Stashed changes:src/components/purchase-cycles/PurchaseCyclesWorkspace.tsx
// Helper function to format property address
const formatPropertyAddress = (address: any): string => {
  if (typeof address === 'string') return address;
  if (address && typeof address === 'object') {
    const parts = [address.street, address.area, address.city].filter(Boolean);
    return parts.join(', ') || 'Property';
  }
  return 'Property';
};

export interface PurchaseCyclesWorkspaceV4Props {
  user: User;
  onNavigate: (section: string, id?: string) => void;
  onStartNew?: () => void;
  onEditCycle?: (cycle: PurchaseCycle) => void;
}

/**
 * PurchaseCyclesWorkspaceV4 - Complete workspace using template system
 */
export const PurchaseCyclesWorkspaceV4: React.FC<PurchaseCyclesWorkspaceV4Props> = ({
  user,
  onNavigate,
  onStartNew,
  onEditCycle,
}) => {
  const { data: cyclesData, isLoading } = usePurchaseCycles();
  const { properties: allProperties } = useProperties();

  const allCycles = useMemo(() => {
    const list = cyclesData?.items ?? [];
    return list.map(mapApiToPurchaseCycle);
  }, [cyclesData?.items]);

  const getProperty = useCallback((propertyId: string): Property | undefined => {
    if (!propertyId) return undefined;
    return allProperties.find((p) => p.id === propertyId);
  }, [allProperties]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = allCycles.filter(c =>
      ['prospecting', 'offer-made', 'negotiation', 'under-contract', 'due-diligence', 'closing'].includes(c.status)
    ).length;
    const completed = allCycles.filter(c => c.status === 'completed').length;
    const underContract = allCycles.filter(c => c.status === 'under-contract').length;

    const totalValue = allCycles
      .filter(c => ['offer-made', 'negotiation', 'under-contract', 'due-diligence', 'closing'].includes(c.status))
      .reduce((sum, c) => sum + (c.negotiatedPrice || c.offerAmount || 0), 0);

    return [
      { label: 'Total', value: allCycles.length, variant: 'default' as const },
      { label: 'Active', value: active, variant: 'success' as const },
      { label: 'Under Contract', value: underContract, variant: 'warning' as const },
      {
        label: 'Pipeline Value',
        value: formatPKR(totalValue).replace('PKR ', ''),
        variant: 'default' as const
      },
    ];
  }, [allCycles]);

  // Define table columns
  const columns: Column<PurchaseCycle>[] = [
    {
      id: 'property',
      label: 'Property / Requirement',
      accessor: (c) => {
        const property = getProperty(c.propertyId);
        const displayLabel = property?.address
          ? (typeof property.address === 'string' ? property.address : formatPropertyAddress(property.address))
          : (c.purchaserName ? `Requirement: ${c.purchaserName}` : 'Requirement');

        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              {property?.images?.[0] ? (
                <img
                  src={property.images[0]}
                  alt={displayLabel}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <Home className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {displayLabel}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {property?.propertyType || 'Requirement'}
              </div>
            </div>
          </div>
        );
      },
      width: '300px',
      sortable: true,
    },
    {
      id: 'offerAmount',
      label: 'Offer Amount',
      accessor: (c) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {formatPKR(c.offerAmount)}
          </div>
          {c.negotiatedPrice && c.negotiatedPrice !== c.offerAmount && (
            <div className="text-xs text-green-600">
              Negotiated: {formatPKR(c.negotiatedPrice)}
            </div>
          )}
        </div>
      ),
      width: '150px',
      sortable: true,
    },
    {
      id: 'purchaser',
      label: 'Purchaser',
      accessor: (c) => (
        <div>
          <div className="text-sm text-gray-900">{c.purchaserName}</div>
          <div className="text-xs text-gray-500 capitalize">{c.purchaserType}</div>
        </div>
      ),
      width: '150px',
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
      id: 'status',
      label: 'Status',
      accessor: (c) => {
        const statusLabels: Record<string, string> = {
          prospecting: 'Prospecting',
          'offer-made': 'Offer Made',
          negotiation: 'Negotiation',
          'under-contract': 'Under Contract',
          'due-diligence': 'Due Diligence',
          closing: 'Closing',
          completed: 'Completed',
          cancelled: 'Cancelled',
        };

        const statusLabel = statusLabels[c.status] || c.status;

        // PHASE 5: Use StatusBadge component with auto-mapping
        return <StatusBadge status={statusLabel} size="sm" />;
      },
      width: '140px',
      sortable: true,
    },
    {
      id: 'financing',
      label: 'Financing',
      accessor: (c) => (
        <div className="text-sm text-gray-900 capitalize">
          {c.financingType}
          {c.financingType === 'loan' && c.loanApproved && (
            <span className="ml-1 text-xs text-green-600">✓</span>
          )}
        </div>
      ),
      width: '110px',
    },
    {
      id: 'offerDate',
      label: 'Offer Date',
      accessor: (c) => (
        <div className="text-sm text-gray-900">
          {c.offerDate ? new Date(c.offerDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) : '-'}
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
        { value: 'prospecting', label: 'Prospecting', count: allCycles.filter(c => c.status === 'prospecting').length },
        { value: 'offer-made', label: 'Offer Made', count: allCycles.filter(c => c.status === 'offer-made').length },
        { value: 'negotiation', label: 'Negotiation', count: allCycles.filter(c => c.status === 'negotiation').length },
        { value: 'under-contract', label: 'Under Contract', count: allCycles.filter(c => c.status === 'under-contract').length },
        { value: 'due-diligence', label: 'Due Diligence', count: allCycles.filter(c => c.status === 'due-diligence').length },
        { value: 'closing', label: 'Closing', count: allCycles.filter(c => c.status === 'closing').length },
        { value: 'completed', label: 'Completed', count: allCycles.filter(c => c.status === 'completed').length },
        { value: 'cancelled', label: 'Cancelled', count: allCycles.filter(c => c.status === 'cancelled').length },
      ],
      multiple: true,
    },
    {
      id: 'purchaserType',
      label: 'Purchaser Type',
      options: [
        { value: 'agency', label: 'Agency', count: allCycles.filter(c => c.purchaserType === 'agency').length },
        { value: 'investor', label: 'Investor', count: allCycles.filter(c => c.purchaserType === 'investor').length },
        { value: 'client', label: 'Client', count: allCycles.filter(c => c.purchaserType === 'client').length },
      ],
      multiple: true,
    },
    {
      id: 'financingType',
      label: 'Financing',
      options: [
        { value: 'cash', label: 'Cash', count: allCycles.filter(c => c.financingType === 'cash').length },
        { value: 'loan', label: 'Loan', count: allCycles.filter(c => c.financingType === 'loan').length },
        { value: 'installment', label: 'Installment', count: allCycles.filter(c => c.financingType === 'installment').length },
        { value: 'other', label: 'Other', count: allCycles.filter(c => c.financingType === 'other').length },
      ],
      multiple: true,
    },
    {
      id: 'dueDiligence',
      label: 'Due Diligence',
      options: [
        {
          value: 'complete',
          label: 'Complete',
          count: allCycles.filter(c => c.titleClear && c.inspectionDone && c.documentsVerified).length
        },
        {
          value: 'pending',
          label: 'Pending',
          count: allCycles.filter(c => !c.titleClear || !c.inspectionDone || !c.documentsVerified).length
        },
      ],
      multiple: false,
    },
  ];

  // Define sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'amount-high', label: 'Amount: High to Low' },
    { value: 'amount-low', label: 'Amount: Low to High' },
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

  const handleFilter = useCallback((cycle: PurchaseCycle, activeFilters: Map<string, any>): boolean => {
    const statusFilter = activeFilters.get('status');
    if (Array.isArray(statusFilter) && statusFilter.length > 0 && !statusFilter.includes(cycle.status)) return false;
    const purchaserTypeFilter = activeFilters.get('purchaserType');
    if (Array.isArray(purchaserTypeFilter) && purchaserTypeFilter.length > 0 && !purchaserTypeFilter.includes(cycle.purchaserType)) return false;
    const financingTypeFilter = activeFilters.get('financingType');
    if (Array.isArray(financingTypeFilter) && financingTypeFilter.length > 0 && !(financingTypeFilter as string[]).includes((cycle as { financingType?: string }).financingType)) return false;
    const dueDiligenceFilter = activeFilters.get('dueDiligence');
    if (dueDiligenceFilter) {
      const c = cycle as { titleClear?: boolean; inspectionDone?: boolean; documentsVerified?: boolean };
      const isComplete = c.titleClear && c.inspectionDone && c.documentsVerified;
      if (dueDiligenceFilter === 'complete' && !isComplete) return false;
      if (dueDiligenceFilter === 'pending' && isComplete) return false;
    }
    return true;
  }, []);

  const handleSort = useCallback((cycles: PurchaseCycle[], sortBy: string, _order?: 'asc' | 'desc'): PurchaseCycle[] => {
    const sorted = [...cycles];

    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = a.offerDate ? new Date(a.offerDate).getTime() : 0;
          const dateB = b.offerDate ? new Date(b.offerDate).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const dateA = a.offerDate ? new Date(a.offerDate).getTime() : 0;
          const dateB = b.offerDate ? new Date(b.offerDate).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'amount-high':
        sorted.sort((a, b) => ((b.negotiatedPrice || b.offerAmount) || 0) - ((a.negotiatedPrice || a.offerAmount) || 0));
        break;
      case 'amount-low':
        sorted.sort((a, b) => ((a.negotiatedPrice || a.offerAmount) || 0) - ((b.negotiatedPrice || b.offerAmount) || 0));
        break;
      default:
        break;
    }
    return sorted;
  }, []);

  const handleSearch = useCallback((cycle: PurchaseCycle, query: string): boolean => {
    const property = getProperty(cycle.propertyId ?? '');
    const searchLower = query.toLowerCase();

    // Format property address for search
    const propertyAddress = property?.address
      ? (typeof property.address === 'string' ? property.address : formatPropertyAddress(property.address))
      : '';

    return (
      (cycle.purchaserName || '').toLowerCase().includes(searchLower) ||
      (cycle.sellerName || '').toLowerCase().includes(searchLower) ||
      (cycle.agentName || '').toLowerCase().includes(searchLower) ||
      propertyAddress.toLowerCase().includes(searchLower) ||
      (property?.propertyType || '').toLowerCase().includes(searchLower) ||
      (cycle.offerAmount || 0).toString().includes(searchLower) ||
      (cycle.negotiatedPrice ? cycle.negotiatedPrice.toString().includes(searchLower) : false)
    );
  }, [getProperty]);

  return (
    <WorkspacePageTemplate
      // Header
      title="Purchase Cycles"
      description="Manage property acquisitions and buying processes"
      stats={stats}

      // Primary action
      primaryAction={{
        label: 'Start Purchase Cycle',
        icon: <Plus className="w-4 h-4" />,
        onClick: onStartNew || (() => toast.info('Start Purchase Cycle clicked')),
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
      items={allCycles}
      getItemId={(cycle) => cycle.id}

      // Table view
      columns={columns}

      // Grid view
      renderCard={(cycle) => (
        <PurchaseCycleWorkspaceCard
          cycle={cycle}
          property={getProperty(cycle.propertyId ?? '') ?? null}
          onClick={() => onNavigate('purchase-cycle-details', cycle.id)}
          onEdit={() => onEditCycle?.(cycle)}
          onDelete={() => toast.info(`Delete cycle ${cycle.id}`)}
        />
      )}

      // Search & Filter
      searchPlaceholder="Search by property, purchaser, seller, agent..."
      onSearch={handleSearch}
      quickFilters={quickFilters}
      onFilter={handleFilter}
      sortOptions={sortOptions}
      onSort={handleSort}

      bulkActions={bulkActions}

      // Item actions
      onItemClick={(cycle) => onNavigate('purchase-cycle-details', cycle.id)}

      // Empty states
      emptyStatePreset={EmptyStatePresets.purchaseCycles(onStartNew ?? (() => {}))}

      // Loading
      isLoading={isLoading}

      // Pagination
      pagination={{ enabled: true, pageSize: 12, pageSizeOptions: [12, 24, 48] }}
    />
  );
};