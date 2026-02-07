/**
 * Purchase Cycle Details - V5.1 with Financial Tracking ✅
 * 
 * COMPLETE REDESIGN using DetailPageTemplate system:
 * - DetailPageTemplate for consistent structure
 * - ContactCard for seller information
 * - QuickActionsPanel for sidebar actions
 * - MetricCardsGroup for statistics
 * - NotesPanel for notes management
 * - CommissionCalculator for investment analysis
 * - ActivityTimeline for activity feed
 * - All 5 UX Laws applied
 * - 8px grid system
 * - Responsive 2/3 + 1/3 layout
 * 
 * PHASE 4: Financial tracking integration for agency purchases
 * 
 * TABS:
 * 1. Overview - Summary + InfoPanels + Sidebar
 * 2. Details - Seller, Due Diligence, Financing
 * 3. Financials - Acquisition costs (Agency only)
 * 4. Payments - Payment tracking from Deal
 * 5. Activity - Timeline of all activities
 * 6. Actions - Status updates and workflows
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseCycle, Property, User, SellCycle } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';

// Icons
import {
  DollarSign,
  TrendingDown,
  CheckCircle,
  FileCheck,
  Settings,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building2,
  Building,
  User as UserIcon,
  Clock,
  MessageSquare,
  Send,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  X,
  Home,
  FileText,
  Wallet,
  Landmark,
  ClipboardCheck,
  Plus,
} from 'lucide-react';

// DetailPageTemplate System
import {
  DetailPageTemplate,
  DetailPageTab,
  QuickActionsPanel,
  MetricCardsGroup,
  SummaryStatsPanel,
  ActivityTimeline,
  Activity,
  ContactCard,
  NotesPanel,
  Note,
} from './layout';

// Foundation Components
import { InfoPanel } from './ui/info-panel';
import { StatusTimeline } from './ui/status-timeline';
import { StatusBadge } from './layout/StatusBadge';

// Phase 4: Financial Components
import {
  PurchaseCycleFinancialSummary,
  AcquisitionCostModal,
} from './agency-financials';

// Business Logic
import {
  updatePurchaseCycle,
  completePurchase,
  cancelPurchaseCycle,
  getPurchaseCycleById,
  addCommunicationLog,
  getAgencyInvestmentROI,
} from '../lib/purchaseCycle';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { toast } from 'sonner';
import { markPurchaseCycleOfferAccepted } from '../lib/purchaseCycle';

// Payment Integration
import { PaymentSummaryReadOnly } from './deals/PaymentSummaryReadOnly';
import { getDealById } from '../lib/deals';

// Offer Sending
import { SendOfferFromPurchaseCycleModal } from './SendOfferFromPurchaseCycleModal';
import { getSellCyclesByProperty } from '../lib/sellCycle';

interface PurchaseCycleDetailsV4Props {
  cycle: PurchaseCycle;
  property: Property;
  user: User;
  onBack: () => void;
  onUpdate: () => void;
  onNavigate?: (page: string, id: string) => void;
}

export function PurchaseCycleDetailsV4({
  cycle: initialCycle,
  property,
  user,
  onBack,
  onUpdate,
  onNavigate,
}: PurchaseCycleDetailsV4Props) {
  const [cycle, setCycle] = useState<PurchaseCycle>(initialCycle);
  const [editingNegotiatedPrice, setEditingNegotiatedPrice] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState(
    cycle.negotiatedPrice || cycle.offerAmount
  );
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [availableSellCycles, setAvailableSellCycles] = useState<SellCycle[]>([]);
  
  // Phase 4: Acquisition Cost Modal state
  const [showAcquisitionCostModal, setShowAcquisitionCostModal] = useState(false);

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
    const updatedCycle = getPurchaseCycleById(cycle.id);
    if (updatedCycle) {
      setCycle(updatedCycle);
    }
  };

  useEffect(() => {
    loadData();
  }, [cycle.id]);

  // Load available sell cycles
  useEffect(() => {
    const sellCycles = getSellCyclesByProperty(property.id);
    const activeSellCycles = sellCycles.filter(
      (sc) =>
        sc.status === 'listed' ||
        sc.status === 'offer-received' ||
        sc.status === 'negotiation'
    );
    setAvailableSellCycles(activeSellCycles);
  }, [property.id]);

  // Get linked deal
  const linkedDeal = useMemo(() => {
    const dealId = cycle.linkedDealId || cycle.createdDealId;
    return dealId ? getDealById(dealId) : null;
  }, [cycle.linkedDealId, cycle.createdDealId]);

  // Calculate metrics
  const dueDiligenceProgress =
    [
      cycle.titleClear,
      cycle.inspectionDone,
      cycle.documentsVerified,
      cycle.surveyCompleted,
    ].filter(Boolean).length / 4;

  const roi = cycle.purchaserType === 'agency' ? getAgencyInvestmentROI(cycle.id) : null;

  // Status update handler
  const handleUpdateStatus = (newStatus: PurchaseCycle['status']) => {
    if (newStatus === 'accepted') {
      if (
        !confirm(
          'Accept this purchase offer?\n\nThis will:\n1. Mark the offer as accepted\n2. Automatically create a Deal\n3. Update the purchase cycle status\n\nProceed?'
        )
      ) {
        return;
      }

      markPurchaseCycleOfferAccepted(
        cycle.id,
        cycle.negotiatedPrice || cycle.offerAmount
      );

      toast.success('Offer accepted! Deal has been created.');
      setTimeout(() => {
        toast.info('📋 Go to Deal Management to track this transaction.');
      }, 2000);

      loadData();
      onUpdate();
      return;
    }

    updatePurchaseCycle(cycle.id, { status: newStatus });
    toast.success('Purchase cycle status updated');
    loadData();
    onUpdate();
  };

  // Due diligence handler
  const handleUpdateDueDiligence = (field: keyof PurchaseCycle, value: boolean) => {
    updatePurchaseCycle(cycle.id, { [field]: value });
    toast.success('Due diligence updated');
    loadData();
  };

  // Negotiated price handler
  const handleSaveNegotiatedPrice = () => {
    updatePurchaseCycle(cycle.id, { negotiatedPrice });
    toast.success('Negotiated price updated');
    setEditingNegotiatedPrice(false);
    loadData();
  };

  // Complete purchase handler
  const handleCompletePurchase = () => {
    if (
      !confirm(
        'Complete this purchase?\n\nThis will transfer property ownership to the purchaser.'
      )
    ) {
      return;
    }

    const result = completePurchase(cycle.id, cycle.negotiatedPrice || cycle.offerAmount);
    if (result.success) {
      toast.success('Purchase completed! Property ownership transferred.');
      loadData();
      onUpdate();
      setTimeout(() => onBack(), 1500);
    } else {
      toast.error(result.error || 'Failed to complete purchase');
    }
  };

  // Cancel cycle handler
  const handleCancelCycle = () => {
    if (confirm('Are you sure you want to cancel this purchase cycle?')) {
      cancelPurchaseCycle(cycle.id, 'Cancelled by user');
      toast.success('Purchase cycle cancelled');
      onUpdate();
      onBack();
    }
  };

  // Communication log as notes
  const communicationNotes: Note[] = useMemo(() => {
    return (cycle.communicationLogs || []).map((log) => ({
      id: log.id,
      content: log.summary,
      createdBy: log.createdBy,
      createdByName: log.createdByName,
      createdAt: log.date,
      type: log.type === 'note' ? 'internal' : 'client',
    }));
  }, [cycle.communicationLogs]);

  // Add communication log
  const handleAddNote = (content: string, type: 'internal' | 'client' | 'general') => {
    const logType: 'call' | 'email' | 'meeting' | 'note' =
      type === 'internal' ? 'note' : 'email';
    addCommunicationLog(cycle.id, logType, content, user.name);
    toast.success('Communication log added');
    loadData();
  };

  // ==================== PAGE HEADER ====================
  const pageHeader = {
    title: `Purchase Cycle: ${formatPropertyAddress(property.address)}`,
    breadcrumbs: [
      { label: 'Purchase Cycles', onClick: onBack },
      {
        label: formatPropertyAddress(property.address),
        onClick: () => handleNavigation('property-detail', property.id),
      },
      { label: 'Purchase Cycle' },
    ],
    description: `${
      cycle.purchaserType.charAt(0).toUpperCase() + cycle.purchaserType.slice(1)
    } Purchase • Created ${new Date(cycle.createdAt).toLocaleDateString()}`,
    metrics: [
      {
        label: 'Asking Price',
        value: formatPKR(cycle.askingPrice),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Offer Amount',
        value: formatPKR(cycle.offerAmount),
        icon: <TrendingDown className="w-4 h-4" />,
      },
      {
        label: 'Negotiated',
        value: cycle.negotiatedPrice ? formatPKR(cycle.negotiatedPrice) : 'Pending',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      {
        label: 'Due Diligence',
        value: `${Math.round(dueDiligenceProgress * 100)}%`,
        icon: <FileCheck className="w-4 h-4" />,
      },
      {
        label: 'Status',
        value: <StatusBadge status={cycle.status} />,
        icon: <Settings className="w-4 h-4" />,
      },
    ],
    primaryActions: [
      {
        label: 'Send Offer',
        onClick: () => setShowSendOfferModal(true),
        variant: 'default' as const,
        disabled: availableSellCycles.length === 0,
      },
    ],
    secondaryActions: [
      {
        label: 'Update Status',
        onClick: () => toast.info('Status update'),
      },
      {
        label: 'Complete Purchase',
        onClick: handleCompletePurchase,
        disabled: cycle.status === 'acquired' || cycle.status === 'cancelled',
      },
      {
        label: 'Cancel Cycle',
        onClick: handleCancelCycle,
        disabled: cycle.status === 'acquired' || cycle.status === 'cancelled',
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
    status: cycle.status,
    onBack,
  };

  // ==================== CONNECTED ENTITIES ====================
  const connectedEntities = [
    {
      type: 'property' as const,
      name: formatPropertyAddress(property.address),
      icon: <Home className="h-3 w-3" />,
      onClick: () => handleNavigation('property-detail', property.id),
    },
    {
      type: 'seller' as const,
      name: cycle.sellerName,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => {},
    },
    {
      type: 'purchaser' as const,
      name: cycle.purchaserName,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => {},
    },
    {
      type: 'agent' as const,
      name: cycle.agentName,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => {},
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
            label: 'Prospecting',
            status: 'complete',
            date: cycle.createdAt,
          },
          {
            label: 'Offer Made',
            status:
              cycle.status === 'offer-made' ||
              ['negotiation', 'accepted', 'due-diligence', 'financing', 'closing', 'acquired'].includes(
                cycle.status
              )
                ? 'complete'
                : cycle.status === 'prospecting'
                ? 'current'
                : 'pending',
            date: cycle.offerDate,
          },
          {
            label: 'Negotiation',
            status:
              cycle.status === 'negotiation'
                ? 'current'
                : ['accepted', 'due-diligence', 'financing', 'closing', 'acquired'].includes(
                    cycle.status
                  )
                ? 'complete'
                : 'pending',
          },
          {
            label: 'Accepted',
            status:
              cycle.status === 'accepted'
                ? 'current'
                : ['due-diligence', 'financing', 'closing', 'acquired'].includes(cycle.status)
                ? 'complete'
                : 'pending',
          },
          {
            label: 'Due Diligence',
            status:
              cycle.status === 'due-diligence'
                ? 'current'
                : ['financing', 'closing', 'acquired'].includes(cycle.status)
                ? 'complete'
                : 'pending',
          },
          {
            label: 'Acquired',
            status:
              cycle.status === 'acquired'
                ? 'complete'
                : cycle.status === 'cancelled'
                ? 'skipped'
                : 'pending',
            date: cycle.actualCloseDate,
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

      {/* Purchase Information */}
      <InfoPanel
        title="Purchase Information"
        data={[
          {
            label: 'Status',
            value: <StatusBadge status={cycle.status} />,
          },
          {
            label: 'Purchaser Type',
            value: <span className="capitalize">{cycle.purchaserType}</span>,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Purchaser Name',
            value: cycle.purchaserName,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Agent',
            value: cycle.agentName,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Offer Date',
            value: cycle.offerDate
              ? new Date(cycle.offerDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A',
            icon: <Calendar className="h-4 w-4" />,
          },
          ...(cycle.targetCloseDate
            ? [
                {
                  label: 'Target Close Date',
                  value: new Date(cycle.targetCloseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }),
                  icon: <Calendar className="h-4 w-4" />,
                },
              ]
            : []),
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Pricing Information */}
      <InfoPanel
        title="Pricing"
        data={[
          {
            label: 'Asking Price',
            value: formatPKR(cycle.askingPrice),
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Offer Amount',
            value: formatPKR(cycle.offerAmount),
            icon: <TrendingDown className="h-4 w-4" />,
          },
          {
            label: 'Negotiated Price',
            value: cycle.negotiatedPrice
              ? formatPKR(cycle.negotiatedPrice)
              : 'Not set',
            icon: <CheckCircle className="h-4 w-4" />,
          },
          ...(cycle.tokenAmount
            ? [
                {
                  label: 'Token Amount',
                  value: formatPKR(cycle.tokenAmount),
                  icon: <Wallet className="h-4 w-4" />,
                },
              ]
            : []),
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Editable Negotiated Price */}
      {cycle.status !== 'acquired' && cycle.status !== 'cancelled' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Update Negotiated Price</Label>
            {!editingNegotiatedPrice && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingNegotiatedPrice(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          {editingNegotiatedPrice ? (
            <div className="flex gap-2">
              <Input
                type="number"
                value={negotiatedPrice}
                onChange={(e) => setNegotiatedPrice(Number(e.target.value))}
                placeholder="Enter negotiated price"
              />
              <Button onClick={handleSaveNegotiatedPrice}>Save</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingNegotiatedPrice(false);
                  setNegotiatedPrice(cycle.negotiatedPrice || cycle.offerAmount);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <p className="text-lg font-medium">
              {cycle.negotiatedPrice
                ? formatPKR(cycle.negotiatedPrice)
                : formatPKR(cycle.offerAmount)}
            </p>
          )}
        </div>
      )}

      {/* Property Information */}
      <InfoPanel
        title="Property Information"
        data={[
          {
            label: 'Address',
            value: formatPropertyAddress(property.address),
            icon: <Home className="h-4 w-4" />,
            copyable: true,
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

      {/* Agency Investment ROI */}
      {cycle.purchaserType === 'agency' && roi && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-base font-medium text-[#030213] mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Investment Analysis
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Investment</p>
              <p className="text-lg font-bold text-[#030213]">{formatPKR(roi.invested)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Expected Return</p>
              <p className="text-lg font-bold text-blue-600">
                {formatPKR(roi.expectedReturn)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Expected ROI</p>
              <p
                className={`text-lg font-bold ${
                  roi.roi > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {roi.roi.toFixed(1)}%
              </p>
            </div>
          </div>
          {cycle.purpose && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm">
                <span className="text-gray-600">Purpose:</span>{' '}
                <span className="font-medium capitalize">{cycle.purpose}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {cycle.notes && (
        <InfoPanel
          title="Notes"
          data={[
            {
              label: 'Details',
              value: cycle.notes,
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
            label: 'Send Offer',
            icon: <Plus className="h-4 w-4" />,
            onClick: () => setShowSendOfferModal(true),
            disabled:
              availableSellCycles.length === 0 ||
              cycle.status === 'acquired' ||
              cycle.status === 'cancelled',
          },
          {
            label: 'Update Status',
            icon: <Settings className="h-4 w-4" />,
            onClick: () => toast.info('Status update modal'),
          },
          {
            label: 'Complete Purchase',
            icon: <CheckCircle className="h-4 w-4" />,
            onClick: handleCompletePurchase,
            disabled: cycle.status === 'acquired' || cycle.status === 'cancelled',
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
        ]}
      />

      {/* Key Metrics */}
      <MetricCardsGroup
        metrics={[
          {
            label: 'Offer Amount',
            value: formatPKR(cycle.offerAmount),
            icon: <TrendingDown className="h-5 w-5" />,
            variant: 'info',
            description: `${Math.round(
              (cycle.offerAmount / cycle.askingPrice) * 100
            )}% of asking`,
          },
          ...(cycle.negotiatedPrice
            ? [
                {
                  label: 'Negotiated Price',
                  value: formatPKR(cycle.negotiatedPrice),
                  icon: <CheckCircle className="h-5 w-5" />,
                  variant: 'success' as const,
                },
              ]
            : []),
          {
            label: 'Due Diligence',
            value: `${Math.round(dueDiligenceProgress * 100)}%`,
            icon: <FileCheck className="h-5 w-5" />,
            variant: 'default' as const,
          },
        ]}
        columns={2}
      />

      {/* Due Diligence Progress */}
      <SummaryStatsPanel
        title="Due Diligence Progress"
        stats={[
          {
            icon: <CheckCircle className="h-4 w-4" />,
            label: 'Title Clear',
            value: cycle.titleClear ? 1 : 0,
            color: cycle.titleClear ? 'green' : 'gray',
          },
          {
            icon: <CheckCircle className="h-4 w-4" />,
            label: 'Inspection Done',
            value: cycle.inspectionDone ? 1 : 0,
            color: cycle.inspectionDone ? 'green' : 'gray',
          },
          {
            icon: <CheckCircle className="h-4 w-4" />,
            label: 'Documents Verified',
            value: cycle.documentsVerified ? 1 : 0,
            color: cycle.documentsVerified ? 'green' : 'gray',
          },
          {
            icon: <CheckCircle className="h-4 w-4" />,
            label: 'Survey Completed',
            value: cycle.surveyCompleted ? 1 : 0,
            color: cycle.surveyCompleted ? 'green' : 'gray',
          },
        ]}
      />

      {/* Financing Info (if applicable) */}
      {cycle.loanAmount && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-[#030213] mb-3 flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Financing
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Loan Amount:</span>
              <span className="font-medium">{formatPKR(cycle.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge
                variant={cycle.loanApproved ? 'default' : 'secondary'}
                className={
                  cycle.loanApproved ? 'bg-green-600' : 'bg-yellow-100 text-yellow-800'
                }
              >
                {cycle.loanApproved ? 'Approved' : 'Pending'}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ==================== DETAILS TAB ====================
  const detailsContent = (
    <>
      {/* Seller Contact Card */}
      <ContactCard
        name={cycle.sellerName}
        role="seller"
        phone={cycle.sellerContact}
        designation={cycle.sellerType}
        notes={cycle.notes}
        onCall={() => window.open(`tel:${cycle.sellerContact}`)}
      />

      {/* Due Diligence Checklist */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-[#030213] mb-4 flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Due Diligence Checklist
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <Checkbox
              checked={cycle.titleClear}
              onCheckedChange={(checked) =>
                handleUpdateDueDiligence('titleClear', checked as boolean)
              }
              disabled={cycle.status === 'acquired' || cycle.status === 'cancelled'}
            />
            <div className="flex-1">
              <Label className="cursor-pointer">Title Clear</Label>
              <p className="text-xs text-gray-500">Property title verified and clear</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <Checkbox
              checked={cycle.inspectionDone}
              onCheckedChange={(checked) =>
                handleUpdateDueDiligence('inspectionDone', checked as boolean)
              }
              disabled={cycle.status === 'acquired' || cycle.status === 'cancelled'}
            />
            <div className="flex-1">
              <Label className="cursor-pointer">Inspection Done</Label>
              <p className="text-xs text-gray-500">
                Physical inspection completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <Checkbox
              checked={cycle.documentsVerified}
              onCheckedChange={(checked) =>
                handleUpdateDueDiligence('documentsVerified', checked as boolean)
              }
              disabled={cycle.status === 'acquired' || cycle.status === 'cancelled'}
            />
            <div className="flex-1">
              <Label className="cursor-pointer">Documents Verified</Label>
              <p className="text-xs text-gray-500">
                All documents checked and verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <Checkbox
              checked={cycle.surveyCompleted}
              onCheckedChange={(checked) =>
                handleUpdateDueDiligence('surveyCompleted', checked as boolean)
              }
              disabled={cycle.status === 'acquired' || cycle.status === 'cancelled'}
            />
            <div className="flex-1">
              <Label className="cursor-pointer">Survey Completed</Label>
              <p className="text-xs text-gray-500">Land survey completed</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{Math.round(dueDiligenceProgress * 100)}%</span>
          </div>
          <Progress value={dueDiligenceProgress * 100} className="h-2" />
        </div>
      </div>

      {/* Financing Information (if applicable) */}
      {cycle.loanAmount && (
        <InfoPanel
          title="Financing Information"
          data={[
            {
              label: 'Loan Amount',
              value: formatPKR(cycle.loanAmount),
              icon: <Landmark className="h-4 w-4" />,
            },
            {
              label: 'Down Payment',
              value: formatPKR(
                (cycle.negotiatedPrice || cycle.offerAmount) - cycle.loanAmount
              ),
              icon: <Wallet className="h-4 w-4" />,
            },
            {
              label: 'Loan to Value',
              value: `${Math.round(
                (cycle.loanAmount / (cycle.negotiatedPrice || cycle.offerAmount)) * 100
              )}%`,
            },
            {
              label: 'Status',
              value: (
                <Badge
                  variant={cycle.loanApproved ? 'default' : 'secondary'}
                  className={
                    cycle.loanApproved ? 'bg-green-600' : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {cycle.loanApproved ? 'Approved' : 'Pending'}
                </Badge>
              ),
            },
          ]}
          columns={2}
          density="comfortable"
        />
      )}
    </>
  );

  // ==================== FINANCIALS TAB ====================
  const financialsContent = (
    <>
      {/* Financial Summary */}
      <PurchaseCycleFinancialSummary
        cycle={cycle}
        property={property}
        onAddAcquisitionCost={() => setShowAcquisitionCostModal(true)}
      />

      {/* Acquisition Cost Modal */}
      <AcquisitionCostModal
        isOpen={showAcquisitionCostModal}
        onClose={() => setShowAcquisitionCostModal(false)}
        purchaseCycle={cycle}
        property={property}
        onSuccess={() => {
          setShowAcquisitionCostModal(false);
          loadData();
          onUpdate();
        }}
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
        Payments are tracked in Deals. Accept the purchase offer to create a Deal and
        manage payment schedules.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
        <p className="text-sm font-medium text-blue-900 mb-2">💡 Next Steps:</p>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>
            Update status to <strong>Accepted</strong> in the Actions tab
          </li>
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
      title: 'Purchase cycle created',
      description: `Offer of ${formatPKR(cycle.offerAmount)} made`,
      date: cycle.createdAt,
      user: cycle.agentName,
      icon: <Plus className="h-5 w-5 text-blue-600" />,
    });

    // Status changes
    if (cycle.status === 'accepted' || cycle.status === 'acquired') {
      activityList.push({
        id: 'accepted',
        type: 'status-change',
        title: 'Offer accepted',
        description: cycle.negotiatedPrice
          ? `Negotiated price: ${formatPKR(cycle.negotiatedPrice)}`
          : undefined,
        date: cycle.createdAt,
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      });
    }

    // Due diligence milestones
    if (cycle.titleClear) {
      activityList.push({
        id: 'title-clear',
        type: 'milestone',
        title: 'Title cleared',
        date: cycle.createdAt,
        icon: <FileCheck className="h-5 w-5 text-green-600" />,
      });
    }

    // Communication logs
    (cycle.communicationLogs || []).forEach((log) => {
      activityList.push({
        id: `log-${log.id}`,
        type: 'communication',
        title: `${log.type.charAt(0).toUpperCase() + log.type.slice(1)} logged`,
        description: log.summary,
        date: log.date,
        user: log.createdByName,
        icon: <FileText className="h-5 w-5 text-gray-600" />,
      });
    });

    // Sort by date descending
    return activityList.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [cycle]);

  const activityContent = (
    <>
      <ActivityTimeline
        title="Activity Timeline"
        activities={activities}
        emptyMessage="No activities yet"
      />

      {/* Communication Notes */}
      <NotesPanel
        notes={communicationNotes}
        currentUserId={user.id}
        currentUserName={user.name}
        title="Communication Logs"
        canAdd={cycle.status !== 'acquired' && cycle.status !== 'cancelled'}
        canEdit={false}
        canDelete={false}
        canPin={false}
        onAdd={handleAddNote}
        placeholder="Add a communication log..."
      />
    </>
  );

  // ==================== ACTIONS TAB ====================
  const actionsContent = (
    <>
      {/* Status Update */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-[#030213] mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Update Status
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'prospecting',
            'offer-made',
            'negotiation',
            'accepted',
            'due-diligence',
            'financing',
            'closing',
            'acquired',
          ].map((status) => (
            <Button
              key={status}
              variant={cycle.status === status ? 'default' : 'outline'}
              onClick={() => handleUpdateStatus(status as PurchaseCycle['status'])}
              disabled={
                cycle.status === 'acquired' ||
                cycle.status === 'cancelled' ||
                cycle.status === status
              }
              className="justify-start capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Workflow Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-[#030213] mb-4 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Workflow Actions
        </h3>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setShowSendOfferModal(true)}
            disabled={
              availableSellCycles.length === 0 ||
              cycle.status === 'acquired' ||
              cycle.status === 'cancelled'
            }
          >
            <Plus className="h-4 w-4" />
            Send Offer to Seller
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleCompletePurchase}
            disabled={cycle.status === 'acquired' || cycle.status === 'cancelled'}
          >
            <CheckCircle className="h-4 w-4" />
            Complete Purchase
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
            onClick={handleCancelCycle}
            disabled={cycle.status === 'acquired' || cycle.status === 'cancelled'}
          >
            <XCircle className="h-4 w-4" />
            Cancel Purchase Cycle
          </Button>
        </div>
      </div>
    </>
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
      id: 'details',
      label: 'Details',
      content: detailsContent,
      layout: '3-0',
    },
    {
      id: 'financials',
      label: 'Financials',
      content: financialsContent,
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
      id: 'actions',
      label: 'Actions',
      content: actionsContent,
      layout: '3-0',
    },
  ];

  // ==================== RENDER ====================
  return (
    <>
      <DetailPageTemplate
        pageHeader={pageHeader}
        connectedEntities={connectedEntities}
        tabs={tabs}
        defaultTab="overview"
      />

      {/* Send Offer Modal */}
      <SendOfferFromPurchaseCycleModal
        isOpen={showSendOfferModal}
        onClose={() => setShowSendOfferModal(false)}
        purchaseCycle={cycle}
        sellCycle={availableSellCycles[0]} // Pass first available sell cycle
        property={property}
        onSuccess={() => {
          setShowSendOfferModal(false);
          loadData();
          onUpdate();
        }}
      />
    </>
  );
}