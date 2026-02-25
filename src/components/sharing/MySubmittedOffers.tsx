/**
 * MySubmittedOffers Component
 * PHASE 5.1: Workspace Implementation ✅
 * 
 * PURPOSE:
 * Tracks all cross-agent offers and rental applications submitted by the current agent.
 * Follows WorkspacePageTemplate for consistent UX and Design System V4.1.
 */

import React, { useMemo, useCallback } from 'react';
import {
  FileText,
  Home,
  MapPin,
  User,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { User as UserType } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  WorkspacePageTemplate,
  Column,
  KanbanColumn
} from '../workspace/WorkspacePageTemplate';
import { OfferStatusBadge } from './OfferStatusBadge';
// [STUBBED] import { getOffersSubmittedByAgent as getSellOffers } from '../../lib/sellCycle';
// [STUBBED] import { getOffersSubmittedByAgent as getRentOffers } from '../../lib/rentCycle';
// [STUBBED] import { getProperties } from '../../lib/data';
import { formatPKR } from '../../lib/currency';

// ===== STUBS for removed prototype functions =====
const getSellOffers = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getRentOffers = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getProperties = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface MySubmittedOffersProps {
  user: UserType;
  onViewProperty?: (propertyId: string, cycleId: string, cycleType: 'sell' | 'rent') => void;
}

export const MySubmittedOffers: React.FC<MySubmittedOffersProps> = ({
  user,
  onViewProperty,
}) => {
  // ==================== DATA FETCHING & NORMALIZATION ====================

  /**
   * Get all properties for location lookup
   */
  const properties = useMemo(() => {
    return getProperties(user.id, user.role);
  }, [user.id, user.role]);

  /**
   * Combine sell and rent offers into a unified structure
   */
  const allOffers = useMemo(() => {
    const sellOffers = getSellOffers(user.id).map(o => ({
      ...o,
      id: `${o.cycleId}-${o.id}`,
      cycleType: 'sell' as const,
      displayAmount: o.amount || o.offerAmount || 0,
      displayName: o.buyerName || 'N/A'
    }));

    const rentOffers = getRentOffers(user.id).map(o => ({
      ...o,
      id: `${o.cycleId}-${o.id}`,
      cycleType: 'rent' as const,
      displayAmount: o.amount || o.proposedRent || 0,
      displayName: o.tenantName || 'N/A'
    }));

    return [...sellOffers, ...rentOffers];
  }, [user.id]);

  /**
   * Calculate stats for the header
   */
  const stats = useMemo(() => [
    {
      label: 'Total Active',
      value: allOffers.length,
      icon: <FileText className="h-4 w-4" />,
      variant: 'info' as const,
    },
    {
      label: 'Pending',
      value: allOffers.filter(o => o.status === 'pending').length,
      icon: <Clock className="h-4 w-4" />,
      variant: 'warning' as const,
    },
    {
      label: 'Accepted',
      value: allOffers.filter(o => o.status === 'accepted').length,
      icon: <CheckCircle2 className="h-4 w-4" />,
      variant: 'success' as const,
    },
    {
      label: 'Sales',
      value: allOffers.filter(o => o.cycleType === 'sell').length,
      icon: <DollarSign className="h-4 w-4" />,
      variant: 'default' as const,
    },
    {
      label: 'Rentals',
      value: allOffers.filter(o => o.cycleType === 'rent').length,
      icon: <Home className="h-4 w-4" />,
      variant: 'default' as const,
    },
  ], [allOffers]);

  // ==================== TABLE CONFIGURATION ====================

  const columns: Column<any>[] = [
    {
      id: 'property',
      label: 'Property & Location',
      accessor: (offer) => {
        const property = properties.find(p => p.id === offer.propertyId);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 truncate max-w-[200px]">
              {offer.cycleTitle || property?.title || 'Unknown Property'}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {property?.address ? `${property.address.areaName}, ${property.address.cityName}` : 'No Location'}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      id: 'type',
      label: 'Type',
      accessor: (offer) => (
        <Badge variant={offer.cycleType === 'sell' ? 'info' : 'secondary'} className="capitalize">
          {offer.cycleType}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: 'amount',
      label: 'Offer Amount',
      accessor: (offer) => (
        <div className="flex flex-col">
          <span className="font-bold text-[#2D6A54]">
            {formatPKR(offer.displayAmount)}
            {offer.cycleType === 'rent' && <span className="text-[10px] ml-0.5">/mo</span>}
          </span>
          {offer.matchScore && (
            <span className="text-[10px] text-blue-600 font-medium">
              {offer.matchScore}% Quality Match
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      id: 'client',
      label: 'Client',
      accessor: (offer) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <span className="text-sm font-medium">{offer.displayName}</span>
        </div>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (offer) => <OfferStatusBadge status={offer.status} size="sm" />,
      sortable: true,
    },
    {
      id: 'date',
      label: 'Submitted',
      accessor: (offer) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">
            {new Date(offer.submittedDate).toLocaleDateString()}
          </span>
          <span className="text-[10px] text-gray-400">
            {new Date(offer.submittedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
      sortable: true,
    },
  ];

  // ==================== KANBAN CONFIGURATION ====================

  const kanbanColumns: KanbanColumn[] = [
    { id: 'pending', label: 'Pending Response', color: '#C17052' },
    { id: 'countered', label: 'In Negotiation', color: '#6B9F8A' },
    { id: 'accepted', label: 'Accepted', color: '#2D6A54' },
    { id: 'rejected', label: 'Declined/Rejected', color: '#8B8B8B' },
  ];

  // ==================== RENDER FUNCTIONS ====================

  /**
   * Render grid card
   */
  const renderCard = (offer: any) => {
    const property = properties.find(p => p.id === offer.propertyId);

    return (
      <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-all group border-gray-100">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50">
            <div className="flex justify-between items-start mb-3">
              <OfferStatusBadge status={offer.status} size="sm" />
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                {offer.cycleType === 'sell' ? 'Sales' : 'Rental'}
              </Badge>
            </div>

            <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
              {offer.cycleTitle || property?.title || 'Property Listing'}
            </h3>

            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {property?.address ? `${property.address.areaName}, ${property.address.cityName}` : 'Location Hidden'}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Offer Amount</p>
                <p className="text-lg font-bold text-[#2D6A54]">
                  {formatPKR(offer.displayAmount)}
                  {offer.cycleType === 'rent' && <span className="text-xs font-normal">/mo</span>}
                </p>
              </div>
              {offer.matchScore && (
                <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                  {offer.matchScore}% Match
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
              <div className="h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center">
                <User className="h-3 w-3 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600 truncate flex-1">
                Client: <span className="font-medium text-gray-800">{offer.displayName}</span>
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-[11px] font-medium"
                onClick={() => onViewProperty?.(offer.propertyId, offer.cycleId, offer.cycleType)}
              >
                View Property
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render kanban card (using simplified grid card)
   */
  const renderKanbanCard = (offer: any) => (
    <div key={offer.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">
          {offer.cycleType === 'sell' ? 'Sale' : 'Rent'}
        </span>
        <span className="text-[9px] text-gray-400">
          {new Date(offer.submittedDate).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight">
        {offer.cycleTitle || 'Property Listing'}
      </p>
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm font-bold text-[#2D6A54]">
          {formatPKR(offer.displayAmount)}
        </span>
        <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="h-2.5 w-2.5 text-gray-400" />
        </div>
      </div>
    </div>
  );

  // ==================== CALLBACKS ====================

  const handleSearch = useCallback((offer: any, query: string) => {
    const q = query.toLowerCase();
    const property = properties.find(p => p.id === offer.propertyId);

    return (
      offer.cycleTitle?.toLowerCase().includes(q) ||
      offer.displayName?.toLowerCase().includes(q) ||
      offer.listingAgentName?.toLowerCase().includes(q) ||
      property?.title?.toLowerCase().includes(q) ||
      property?.address?.areaName?.toLowerCase().includes(q)
    );
  }, [properties]);

  const handleFilter = useCallback((offer: any, filters: Map<string, any>) => {
    // Basic status and type filtering
    if (filters.has('status') && filters.get('status') !== 'all') {
      if (offer.status !== filters.get('status')) return false;
    }
    if (filters.has('type') && filters.get('type') !== 'all') {
      if (offer.cycleType !== filters.get('type')) return false;
    }
    return true;
  }, []);

  // ==================== MAIN RENDER ====================

  return (
    <WorkspacePageTemplate
      title="My Submitted Offers"
      description="Track and manage all your outgoing offers and applications submitted on shared listings."
      icon={<Briefcase className="h-6 w-6 text-blue-600" />}
      stats={stats}

      // Data
      items={allOffers}
      getItemId={(o) => o.id}

      // Views
      availableViews={['table', 'grid', 'kanban']}
      defaultView="grid"

      // Table
      columns={columns}

      // Grid
      renderCard={renderCard}

      // Kanban
      kanbanColumns={kanbanColumns}
      getKanbanColumn={(offer) => offer.status}
      renderKanbanCard={renderKanbanCard}

      // Search & Filter
      searchPlaceholder="Search properties, clients, or agents..."
      onSearch={handleSearch}
      onFilter={handleFilter}
      quickFilters={[
        {
          id: 'status',
          label: 'Status',
          options: [
            { label: 'All Status', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Countered', value: 'countered' },
            { label: 'Accepted', value: 'accepted' },
            { label: 'Rejected', value: 'rejected' },
          ],
        },
        {
          id: 'type',
          label: 'Transaction Type',
          options: [
            { label: 'All Types', value: 'all' },
            { label: 'Sales', value: 'sell' },
            { label: 'Rentals', value: 'rent' },
          ],
        },
      ]}
      sortOptions={[
        { label: 'Newest First', value: 'submittedDate' },
        { label: 'Amount: High to Low', value: 'displayAmount' },
        { label: 'Property Name', value: 'cycleTitle' },
        { label: 'Status', value: 'status' },
      ]}

      // Callbacks
      onItemClick={(offer) => onViewProperty?.(offer.propertyId, offer.cycleId, offer.cycleType)}

      // Empty States
      emptyStatePreset={{
        variant: 'no-data',
        title: 'No Offers Submitted',
        description: "You haven't submitted any offers on shared properties yet. Start matching your clients with shared listings to see them here.",
        icon: <Briefcase className="h-12 w-12 text-gray-300" />
      }}
    />
  );
};

export default MySubmittedOffers;
