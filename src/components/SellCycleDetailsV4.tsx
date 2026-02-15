/**
 * Sell Cycle Details - V5.0 with DetailPageTemplate ✅
 * 
 * COMPLETE REDESIGN using DetailPageTemplate system:
 * - DetailPageTemplate for consistent structure
 * - QuickActionsPanel for sidebar actions
 * - MetricCardsGroup for statistics
 * - DataTable for offers list
 * - PaymentSummaryPanel for payments
 * - ActivityTimeline for activity feed
 * - All 5 UX Laws applied
 * - 8px grid system
 * - Responsive 2/3 + 1/3 layout
 * 
 * TABS:
 * 1. Overview - Summary + InfoPanels + Sidebar
 * 2. Offers - Table view of all offers
 * 3. Payments - Payment tracking from Deal
 * 4. Activity - Timeline of all activities
 * 5. Financials - Financial tracking and summary
 * 
 * PHASE 4B: SHARING INTEGRATION ✅
 * - ShareToggle in header for cycle owners
 * - AccessBanner for viewing shared cycles
 * - CrossAgentOfferCard for cross-agent offers
 * - Cross-agent offer acceptance workflow
 */

import { useState, useEffect, useMemo } from 'react';
import { SellCycle, Property, User, Offer } from '../types';
import { PropertyAddressDisplay, useFormattedAddress } from './PropertyAddressDisplay';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// DetailPageTemplate System
import {
  DetailPageTemplate,
  DetailPageTab,
  QuickActionsPanel,
  MetricCardsGroup,
  SummaryStatsPanel,
  DataTable,
  DataTableColumn,
  ActivityTimeline,
  Activity,
} from './layout';

// Foundation Components
import { InfoPanel } from './ui/info-panel';
import { StatusTimeline } from './ui/status-timeline';
import { StatusBadge } from './layout/StatusBadge';

// Sharing Components (Phase 4B)
import { ShareToggle } from './sharing/ShareToggle';
import { AccessBanner } from './sharing/AccessBanner';

// Icons
import {
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  Home,
  User as UserIcon,
  MapPin,
  Percent,
  Edit,
  Building,
  AlertCircle,
  Wallet,
  Eye,
} from 'lucide-react';

// Business Logic
// [STUBBED] import {
// [STUBBED]   acceptOffer,
// [STUBBED]   rejectOffer,
// [STUBBED]   getSellCycleById,
// [STUBBED]   toggleSellCycleSharing,
// [STUBBED] } from '../lib/sellCycle';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { toast } from 'sonner';

// Modals
import { AddOfferModal } from './AddOfferModal';

// Payment Integration
import { PaymentSummaryReadOnly } from './deals/PaymentSummaryReadOnly';
// [STUBBED] import { getDealById } from '../lib/deals';

// Phase 5: Financial Tracking Integration
import { SellCycleFinancialSummary, SaleProfitModal } from './agency-financials';

import { logger } from "../lib/logger";
// Phase 4B: Cross-agent deal operations
// Phase 4B: Cross-agent deal operations
// [STUBBED] import {
// [STUBBED]   createDealFromCrossAgentOffer
// [STUBBED] } from '../lib/deals';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

// ===== STUBS for removed prototype functions =====
const acceptOffer = (..._args: any[]): any => { /* stub - prototype function removed */ };
const rejectOffer = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getSellCycleById = (..._args: any[]): any => { /* stub - prototype function removed */ };
const toggleSellCycleSharing = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getDealById = (..._args: any[]): any => { /* stub - prototype function removed */ };
const createDealFromCrossAgentOffer = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface SellCycleDetailsV4Props {
  cycle: SellCycle;
  property: Property;
  user: User;
  onBack: () => void;
  onUpdate: () => void;
  onNavigate?: (page: string, id: string) => void;
}

export function SellCycleDetailsV4({
  cycle: initialCycle,
  property,
  user,
  onBack,
  onUpdate,
  onNavigate,
}: SellCycleDetailsV4Props) {
  const [cycle, setCycle] = useState<SellCycle>(initialCycle);
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  // Phase 5: Sale financial tracking
  const [showSaleProfitModal, setShowSaleProfitModal] = useState(false);

  // Dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'accept' | 'reject';
    offerId: string;
    message: string;
    isCrossAgent?: boolean;
    agentName?: string;
  } | null>(null);

  const handleAcceptOfferClick = (offerId: string) => {
    const offer = cycle.offers.find(o => o.id === offerId);
    if (!offer) {
      toast.error('Offer not found');
      return;
    }

    setConfirmAction({
      type: 'accept',
      offerId,
      message: offer.submittedByAgentId
        ? `Accept this CROSS-AGENT offer from ${offer.submittedByAgentName}? This will create a coordinated deal and split commission.`
        : 'Accept this offer? This will reject all other pending offers and automatically create a Deal for this transaction.',
      isCrossAgent: !!offer.submittedByAgentId,
      agentName: offer.submittedByAgentName
    });
    setConfirmDialogOpen(true);
  };

  const handleRejectOfferClick = (offerId: string) => {
    setConfirmAction({
      type: 'reject',
      offerId,
      message: 'Reject this offer? This cannot be undone.'
    });
    setConfirmDialogOpen(true);
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'accept') {
        const offer = cycle.offers.find(o => o.id === confirmAction.offerId);
        if (!offer) throw new Error('Offer not found');

        if (confirmAction.isCrossAgent) {
          createDealFromCrossAgentOffer(offer as any, cycle.id);
        } else {
          acceptOffer(cycle.id, confirmAction.offerId);
        }

        toast.success('Offer accepted! Deal has been created.');
        setTimeout(() => {
          toast.info('📋 Go to Deal Management to track this transaction.');
        }, 2000);
      } else {
        rejectOffer(cycle.id, confirmAction.offerId);
        toast.success('Offer rejected');
      }

      loadData();
      onUpdate();
    } catch (error) {
      logger.error(`Error ${confirmAction.type}ing offer:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${confirmAction.type} offer`);
    } finally {
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };


  // Phase 4B: Determine access level
  const isOwner = cycle.agentId === user.id;
  const isShared = cycle.sharing?.isShared || false;
  const isSharedWithMe = !isOwner && isShared;

  // Determine access level for AccessBanner
  const accessLevel: 'owner' | 'shared-full' | 'shared-limited' | 'none' = isOwner
    ? 'owner'
    : isSharedWithMe
      ? cycle.sharing?.privacy?.hideSellerContact
        ? 'shared-limited'
        : 'shared-full'
      : 'none';

  // Protected fields for AccessBanner
  const protectedFields = isSharedWithMe && cycle.sharing?.privacy?.hideSellerContact
    ? ['seller-contact', 'seller-email', 'financial-details']
    : [];

  // Navigation helper
  const handleNavigation = (page: string, id: string) => {
    if (onNavigate) {
      onNavigate(page, id);
    } else {
      toast.info('Navigate to ' + page);
    }
  };

  // Load data
  const loadData = () => {
    const updatedCycle = getSellCycleById(cycle.id);
    if (updatedCycle) {
      setCycle(updatedCycle);
    }
  };

  useEffect(() => {
    loadData();
  }, [cycle.id]);

  // Listen for updates
  useEffect(() => {
    const handleOfferUpdate = () => loadData();
    const handleCycleUpdate = (event: CustomEvent) => {
      if (event.detail?.cycleId === cycle.id || event.detail?.sellCycleId === cycle.id) {
        loadData();
      }
    };
    const handleDealCreated = (event: CustomEvent) => {
      // Reload when a deal is created for this cycle
      if (event.detail?.sellCycleId === cycle.id) {
        logger.log('🎉 Deal created event received, reloading cycle data...');
        loadData();
      }
    };

    window.addEventListener('offerCreated', handleOfferUpdate);
    window.addEventListener('cycleUpdated', handleCycleUpdate as EventListener);
    window.addEventListener('dealCreated', handleDealCreated as EventListener);

    return () => {
      window.removeEventListener('offerCreated', handleOfferUpdate);
      window.removeEventListener('cycleUpdated', handleCycleUpdate as EventListener);
      window.removeEventListener('dealCreated', handleDealCreated as EventListener);
    };
  }, [cycle.id]);

  // Calculate metrics
  const daysListed = Math.floor(
    (Date.now() - new Date(cycle.listedDate || cycle.createdAt).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  const totalOffers = cycle.offers?.length || 0;
  const highestOffer =
    (cycle.offers || []).reduce((max, offer) => Math.max(max, offer.amount || offer.offerAmount || 0), 0);
  const pendingOffers = (cycle.offers || []).filter((o) => o.status === 'pending');
  const acceptedOffer = cycle.offers?.find((o) => o.id === cycle.acceptedOfferId);

  // Sort offers
  const allOffersSorted = useMemo(() => {
    return [...(cycle.offers || [])].sort(
      (a, b) => new Date(b.offeredDate || b.submittedDate || 0).getTime() -
        new Date(a.offeredDate || a.submittedDate || 0).getTime()
    );
  }, [cycle.offers]);


  // Get linked deal
  const linkedDeal = useMemo(() => {
    const dealId = cycle.linkedDealId || cycle.createdDealId;
    return dealId ? getDealById(dealId) : null;
  }, [cycle.linkedDealId, cycle.createdDealId, cycle.status, cycle.updatedAt]);

  // CRITICAL FIX: Use proper address formatting
  const formattedAddress = useFormattedAddress(property, 'full');

  // ==================== PAGE HEADER ====================
  const pageHeader = {
    title: cycle.title || property.title || formattedAddress,
    breadcrumbs: [
      { label: 'Properties', onClick: onBack },
      {
        label: property.title || formattedAddress,
        onClick: () => handleNavigation('property-detail', property.id),
      },
      { label: 'Sell Cycle' },
    ],
    description: `Listed by ${cycle.agentName} • ${new Date(cycle.listedDate || cycle.createdAt).toLocaleDateString()}`,
    metrics: [
      {
        label: 'Asking Price',
        value: formatPKR(cycle.askingPrice),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Highest Offer',
        value: highestOffer > 0 ? formatPKR(highestOffer) : 'No offers',
        icon: <TrendingUp className="w-4 h-4" />,
      },
      {
        label: 'Total Offers',
        value: totalOffers.toString(),
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: 'Days Listed',
        value: daysListed.toString(),
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        label: 'Status',
        value: cycle.status.toUpperCase(),
        icon: <CheckCircle className="w-4 h-4" />,
      },
    ],
    primaryActions: [
      {
        label: 'Record Offer',
        onClick: () => setShowAddOfferModal(true),
        variant: 'default' as const,
      },
    ],
    secondaryActions: [
      {
        label: 'Edit Cycle',
        onClick: () => toast.info('Edit cycle'),
      },
      {
        label: 'View Property',
        onClick: () => handleNavigation('property-detail', property.id),
      },
      ...(linkedDeal
        ? [
          {
            label: 'View Deal',
            onClick: () => handleNavigation('deal-detail', linkedDeal.id),
          },
        ]
        : []),
    ],
    status: {
      label: cycle.status.toUpperCase(),
      variant: (cycle.status === 'sold' || cycle.status === 'completed' ? 'success' : 'info') as any,
    },
    onBack,
  };

  // ==================== CONNECTED ENTITIES ====================
  const connectedEntities = [
    {
      type: 'property' as const,
      name: property.title || formattedAddress,
      icon: <Home className="h-3 w-3" />,
      onClick: () => handleNavigation('property-detail', property.id),
    },
    {
      type: 'seller' as const,
      name: cycle.sellerName,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => { },
    },
    {
      type: 'agent' as const,
      name: (cycle.agentName || 'Unknown Agent') as string,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => { },
    },
    ...(linkedDeal
      ? [
        {
          type: 'deal' as const,
          name: 'View Deal',
          icon: <FileText className="h-3 w-3" />,
          onClick: () => handleNavigation('deal-detail', linkedDeal.id),
        },
      ]
      : []),
  ];

  // ==================== OVERVIEW TAB - LEFT COLUMN ====================
  const overviewContent = (
    <>
      {/* Status Timeline */}
      <StatusTimeline
        steps={[
          {
            label: 'Listed',
            status: 'complete',
            date: cycle.listedDate || cycle.createdAt,
            description: `Asking ${formatPKR(cycle.askingPrice)}`,
          },
          {
            label: 'Offers Received',
            status:
              totalOffers > 0
                ? 'complete'
                : cycle.status === 'listed'
                  ? 'current'
                  : 'pending',
            description: `${totalOffers} offer${totalOffers !== 1 ? 's' : ''}`,
          },
          {
            label: 'Negotiation',
            status:
              cycle.status === 'negotiation'
                ? 'current'
                : ['under-contract', 'sold'].includes(cycle.status)
                  ? 'complete'
                  : 'pending',
          },
          {
            label: 'Under Contract',
            status:
              cycle.status === 'under-contract'
                ? 'current'
                : cycle.status === 'sold'
                  ? 'complete'
                  : 'pending',
            date: acceptedOffer?.offeredDate,
          },
          {
            label: 'Sold',
            status:
              cycle.status === 'sold'
                ? 'complete'
                : cycle.status === 'cancelled'
                  ? 'skipped'
                  : 'pending',
          },
        ]}
      />

      {/* Payment Summary from Deal */}
      {linkedDeal && (
        <PaymentSummaryReadOnly
          deal={linkedDeal}
          onViewFullDetails={() => handleNavigation('deal-detail', linkedDeal.id)}
          compact={false}
        />
      )}

      {/* Cycle Information */}
      <InfoPanel
        title="Cycle Information"
        data={[
          {
            label: 'Status',
            value: <StatusBadge status={cycle.status} />,
          },
          {
            label: 'Asking Price',
            value: formatPKR(cycle.askingPrice),
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Listed Date',
            value: new Date(cycle.listedDate || cycle.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Days Listed',
            value: daysListed.toString(),
            icon: <Clock className="h-4 w-4" />,
          },
          {
            label: 'Total Offers',
            value: totalOffers.toString(),
            icon: <FileText className="h-4 w-4" />,
          },
          {
            label: 'Pending Offers',
            value: pendingOffers.length.toString(),
            icon: <AlertCircle className="h-4 w-4" />,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Property Information */}
      <InfoPanel
        title="Property Information"
        data={[
          {
            label: 'Address',
            value: <PropertyAddressDisplay property={property} />,
            icon: <MapPin className="h-4 w-4" />,
            copyable: false,
            onClick: () => handleNavigation('property-detail', property.id),
          },
          {
            label: 'Type',
            value: <span className="capitalize">{property.propertyType}</span>,
            icon: <Building className="h-4 w-4" />,
          },
          {
            label: 'Area',
            value: `${property.area} ${property.areaUnit || 'sq yd'}`,
            icon: <Home className="h-4 w-4" />,
          },
          ...(property.bedrooms
            ? [{ label: 'Bedrooms', value: property.bedrooms.toString() }]
            : []),
          ...(property.bathrooms
            ? [{ label: 'Bathrooms', value: property.bathrooms.toString() }]
            : []),
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Seller & Commission */}
      <InfoPanel
        title="Seller & Commission"
        data={[
          {
            label: 'Seller Name',
            value: cycle.sellerName,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Seller Type',
            value: <span className="capitalize">{cycle.sellerType || 'Individual'}</span>,
          },
          {
            label: 'Commission',
            value:
              cycle.commissionType === 'percentage'
                ? `${cycle.commissionRate}%`
                : formatPKR(cycle.commissionRate),
            icon: <Percent className="h-4 w-4" />,
          },
          {
            label: 'Est. Commission Amount',
            value: formatPKR(
              (cycle as any).commissionType === 'percentage'
                ? (cycle.askingPrice * (cycle.commissionRate || 0)) / 100
                : (cycle.commissionRate || 0)
            ),
            icon: <DollarSign className="h-4 w-4" />,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Description */}
      {cycle.description && (
        <InfoPanel
          title="Description"
          data={[
            {
              label: 'Details',
              value: cycle.description,
            },
          ]}
          columns={1}
          density="comfortable"
          showDivider={false}
        />
      )}

      {/* Amenities */}
      {cycle.amenities && cycle.amenities.length > 0 && (
        <InfoPanel
          title="Amenities"
          data={[
            {
              label: 'Available Features',
              value: (
                <div className="flex flex-wrap gap-2 mt-1">
                  {cycle.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              ),
            },
          ]}
          columns={1}
          density="comfortable"
          showDivider={false}
        />
      )}
    </>
  );

  // ==================== OVERVIEW TAB - RIGHT COLUMN ====================
  const overviewSidebar = (
    <>
      {/* Quick Actions */}
      <QuickActionsPanel
        title="Quick Actions"
        actions={[
          {
            label: 'Record Offer',
            icon: <Plus className="h-4 w-4" />,
            onClick: () => setShowAddOfferModal(true),
            disabled: cycle.status === 'sold' || cycle.status === 'cancelled',
          },
          {
            label: 'View Property',
            icon: <Home className="h-4 w-4" />,
            onClick: () => handleNavigation('property-detail', property.id),
          },
          ...(linkedDeal
            ? [
              {
                label: 'View Deal',
                icon: <FileText className="h-4 w-4" />,
                onClick: () => handleNavigation('deal-detail', linkedDeal.id),
              },
            ]
            : []),
          {
            label: 'Edit Cycle',
            icon: <Edit className="h-4 w-4" />,
            onClick: () => toast.info('Edit cycle modal'),
          },
        ]}
      />

      {/* Key Metrics */}
      <MetricCardsGroup
        metrics={[
          {
            label: 'Asking Price',
            value: formatPKR(cycle.askingPrice),
            icon: <DollarSign className="h-5 w-5" />,
            variant: 'info',
          },
          ...(highestOffer > 0
            ? [
              {
                label: 'Highest Offer',
                value: formatPKR(highestOffer),
                icon: <TrendingUp className="h-5 w-5" />,
                variant: 'success' as const,
              },
            ]
            : []),
          {
            label: 'Days Listed',
            value: daysListed.toString(),
            icon: <Clock className="h-5 w-5" />,
            variant: 'default' as const,
          },
        ]}
        columns={2}
      />

      {/* Offer Statistics */}
      <SummaryStatsPanel
        title="Offer Status"
        stats={[
          {
            icon: <FileText className="h-4 w-4" />,
            label: 'Total Offers',
            value: totalOffers,
            color: 'blue',
          },
          {
            icon: <Clock className="h-4 w-4" />,
            label: 'Pending',
            value: pendingOffers.length,
            color: 'yellow',
          },
          {
            icon: <CheckCircle className="h-4 w-4" />,
            label: 'Accepted',
            value: cycle.acceptedOfferId ? 1 : 0,
            color: 'green',
          },
          {
            icon: <XCircle className="h-4 w-4" />,
            label: 'Rejected',
            value: cycle.offers?.filter((o) => o.status === 'rejected').length || 0,
            color: 'red',
          },
        ]}
      />

      {/* Next Steps */}
      {cycle.status === 'under-contract' && acceptedOffer && !linkedDeal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Next Step</h3>
              <p className="text-xs text-blue-700">
                An offer has been accepted. A Deal should be created to manage the transaction.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => toast.info('Deal creation flow')}
          >
            Create Deal
          </Button>
        </div>
      )}
    </>
  );

  // ==================== OFFERS TAB ====================
  const offersColumns: DataTableColumn<Offer>[] = [
    {
      header: 'Date',
      accessor: 'offeredDate',
      render: (offer) =>
        new Date(offer.offeredDate || offer.submittedDate || 0).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      header: 'Buyer Details',
      accessor: 'buyerName',
      render: (offer) => {
        const isCrossAgent = !!offer.submittedByAgentId;
        const isAccepted = offer.status === 'accepted';
        const showDetails = !isCrossAgent || isAccepted;

        return (
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {showDetails ? offer.buyerName : 'Anonymized Buyer'}
              </p>
              {!showDetails && (
                <Badge variant="outline" className="text-[10px] h-4 border-amber-200 text-amber-700 bg-amber-50">
                  PRIVATE
                </Badge>
              )}
            </div>
            {showDetails && (
              <>
                {offer.buyerContact && (
                  <p className="text-xs text-gray-500">{offer.buyerContact}</p>
                )}
                {offer.buyerEmail && (
                  <p className="text-xs text-gray-400">{offer.buyerEmail}</p>
                )}
              </>
            )}
            {isCrossAgent && (
              <p className="text-[10px] text-blue-600 font-medium mt-0.5 uppercase tracking-wider">
                Via: {offer.submittedByAgentName}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Offer Amount',
      accessor: 'offerAmount',
      render: (offer) => (
        <div>
          <p className="font-medium">{formatPKR(offer.offerAmount)}</p>
          <p className="text-xs text-gray-500">
            {(((offer.amount || offer.offerAmount || 0) / cycle.askingPrice) * 100).toFixed(1)}% of asking
          </p>
        </div>
      ),
    },
    {
      header: 'Token',
      accessor: 'tokenAmount',
      render: (offer) => (offer.tokenAmount ? formatPKR(offer.tokenAmount) : '-'),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (offer) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={offer.status} size="sm" />
          {offer.id === cycle.acceptedOfferId && (
            <Badge variant="default" className="bg-green-600 text-white">
              ACCEPTED
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (offer) =>
        offer.status === 'pending' &&
          cycle.status !== 'sold' &&
          cycle.status !== 'cancelled' ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAcceptOfferClick(offer.id)}
              className="h-8"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRejectOfferClick(offer.id)}
              className="h-8"
            >
              <XCircle className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="h-8">
            <Eye className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  const offersContent = (
    <>
      {/* Summary Metrics */}
      <MetricCardsGroup
        metrics={[
          {
            label: 'Total Offers',
            value: totalOffers.toString(),
            icon: <FileText className="h-5 w-5" />,
            variant: 'info',
          },
          {
            label: 'Pending',
            value: pendingOffers.length.toString(),
            icon: <Clock className="h-5 w-5" />,
            variant: 'warning',
          },
          {
            label: 'Accepted',
            value: (cycle.acceptedOfferId ? 1 : 0).toString(),
            icon: <CheckCircle className="h-5 w-5" />,
            variant: 'success',
          },
          {
            label: 'Rejected',
            value: (
              cycle.offers?.filter((o) => o.status === 'rejected').length || 0
            ).toString(),
            icon: <XCircle className="h-5 w-5" />,
            variant: 'danger',
          },
        ]}
        columns={4}
      />

      {/* Offers Table */}
      <DataTable
        title="All Offers"
        headerAction={
          cycle.status !== 'sold' && cycle.status !== 'cancelled' ? (
            <Button onClick={() => setShowAddOfferModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Offer
            </Button>
          ) : undefined
        }
        columns={offersColumns}
        data={allOffersSorted}
        emptyMessage="No offers yet. Record the first offer to get started."
      />
    </>
  );

  // ==================== PAYMENTS TAB ====================
  const paymentsContent = linkedDeal ? (
    <PaymentSummaryReadOnly
      deal={linkedDeal}
      onViewFullDetails={() => handleNavigation('deal-detail', linkedDeal.id)}
      compact={false}
    />
  ) : (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-base mb-2">No Payment Information</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        Payments are tracked in Deals. Accept an offer to create a Deal and manage payment
        schedules.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
        <p className="text-sm font-medium text-blue-900 mb-2">💡 Next Steps:</p>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Review and accept an offer in the <strong>Offers</strong> tab</li>
          <li>A Deal will be automatically created</li>
          <li>Manage payment schedules in the Deal</li>
          <li>Track all payments through the unified system</li>
        </ol>
      </div>
    </div>
  );

  // ==================== ACTIVITY TAB ====================
  const activities: Activity[] = useMemo(() => {
    const activityList: Activity[] = [];

    // Cycle created
    activityList.push({
      id: 'created',
      type: 'created',
      title: 'Sell cycle created',
      description: `Listed for ${formatPKR(cycle.askingPrice)}`,
      date: cycle.createdAt,
      user: cycle.agentName,
      icon: <Plus className="h-5 w-5 text-blue-600" />,
    });

    // Offers
    cycle.offers?.forEach((offer) => {
      activityList.push({
        id: `offer-${offer.id}`,
        type: 'offer',
        title: 'Offer received',
        description: `${formatPKR(offer.amount || offer.offerAmount || 0)} from ${offer.buyerName}`,
        date: offer.offeredDate || offer.submittedDate || cycle.createdAt,
        icon: <FileText className="h-5 w-5 text-green-600" />,
      });

      if (offer.status === 'accepted') {
        activityList.push({
          id: `offer-accepted-${offer.id}`,
          type: 'offer-accepted',
          title: 'Offer accepted',
          description: `Accepted offer of ${formatPKR(offer.amount || offer.offerAmount || 0)}`,
          date: offer.offeredDate || offer.submittedDate || cycle.createdAt,
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        });
      } else if (offer.status === 'rejected') {
        activityList.push({
          id: `offer-rejected-${offer.id}`,
          type: 'offer-rejected',
          title: 'Offer rejected',
          description: `Rejected offer of ${formatPKR(offer.amount || offer.offerAmount || 0)}`,
          date: offer.offeredDate || offer.submittedDate || cycle.createdAt,
          icon: <XCircle className="h-5 w-5 text-red-600" />,
        });
      }
    });

    // Sort by date descending
    return activityList.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [cycle]);

  const activityContent = (
    <ActivityTimeline
      title="Activity Timeline"
      activities={activities}
      emptyMessage="No activities yet"
    />
  );

  // ==================== FINANCIALS TAB (Phase 5) ====================
  const financialsContent = (
    <SellCycleFinancialSummary
      cycle={cycle}
      property={property}
      onRecordSale={() => setShowSaleProfitModal(true)}
    />
  );

  // ==================== TABS CONFIGURATION ====================
  const tabs: DetailPageTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: overviewContent,
      sidebar: overviewSidebar,
      layout: '2-1',
    },
    {
      id: 'offers',
      label: 'Offers',
      badge: totalOffers > 0 ? totalOffers : undefined,
      content: offersContent,
      layout: '3-0',
    },
    {
      id: 'payments',
      label: 'Payments',
      content: paymentsContent,
      layout: '3-0',
    },
    {
      id: 'activity',
      label: 'Activity',
      content: activityContent,
      layout: '3-0',
    },
    {
      id: 'financials',
      label: 'Financials',
      content: financialsContent,
      layout: '3-0',
    },
  ];

  // ==================== RENDER ====================
  return (
    <>
      {/* Phase 4B: Access Banner for Shared Cycles */}
      {isSharedWithMe && (
        <div className="bg-gray-50 pt-4 px-6">
          <AccessBanner
            accessLevel={accessLevel}
            ownerName={cycle.agentName || 'Unknown Agent'}
            cycleType="sell"
            protectedFields={protectedFields}
          />
        </div>
      )}

      <DetailPageTemplate
        pageHeader={pageHeader}
        connectedEntities={connectedEntities}
        tabs={tabs}
        defaultTab="overview"
      />

      {/* Phase 4B: Share Toggle - Floating Action */}
      {isOwner && (
        <div className="fixed bottom-6 right-6 z-50">
          <ShareToggle
            cycleId={cycle.id}
            cycleType="sell"
            isShared={isShared}
            viewCount={cycle.collaboration?.viewCount || 0}
            viewedBy={cycle.collaboration?.viewedBy || []}
            user={user}
            onToggle={(isShared, userId, userName) => {
              toggleSellCycleSharing(cycle.id, isShared, userId, userName);
              loadData();
              onUpdate();
            }}
          />
        </div>
      )}

      {/* Modals */}
      <AddOfferModal
        isOpen={showAddOfferModal}
        onClose={() => setShowAddOfferModal(false)}
        sellCycleId={cycle.id}
        askingPrice={cycle.askingPrice}
        user={user}
        onSuccess={() => {
          loadData();
          onUpdate();
        }}
      />

      {/* Phase 5: Sale Profit Modal */}
      <SaleProfitModal
        isOpen={showSaleProfitModal}
        onClose={() => setShowSaleProfitModal(false)}
        propertyId={property.id}
        propertyAddress={formatPropertyAddress(property.address)}
        acquisitionDate={property.createdAt}
        sellCycleId={cycle.id}
        dealId={linkedDeal?.id}
        userId={user.id}
        userName={user.name}
        initialSalePrice={acceptedOffer?.offerAmount}
        initialCommission={
          cycle.commissionType === 'percentage'
            ? (acceptedOffer?.offerAmount || cycle.askingPrice) * (cycle.commissionRate / 100)
            : cycle.commissionRate
        }
        onSuccess={() => {
          setShowSaleProfitModal(false);
          loadData();
          onUpdate();
        }}
      />

      {/* Confirmation Dialog for Offers */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'accept' ? 'Accept Offer' : 'Reject Offer'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmAction}
              className={confirmAction?.type === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {confirmAction?.type === 'accept' ? 'Confirm Acceptance' : 'Confirm Rejection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}