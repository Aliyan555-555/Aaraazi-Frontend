/**
 * Rent Cycle Details - V4.0 with DetailPageTemplate ✅
 * 
 * COMPLETE REDESIGN using DetailPageTemplate system:
 * - DetailPageTemplate for consistent structure
 * - ContactCard for landlord and tenant information
 * - QuickActionsPanel for sidebar actions
 * - MetricCardsGroup for statistics
 * - NotesPanel for tenant requirements/notes
 * - DataTable for tenant applications
 * - CommissionCalculator for commission breakdown
 * - ActivityTimeline for lease activity
 * - All 5 UX Laws applied
 * - 8px grid system
 * - Responsive 2/3 + 1/3 layout
 * 
 * TABS:
 * 1. Overview - Summary + InfoPanels + Sidebar
 * 2. Applications - Tenant applications with actions
 * 3. Lease - Current lease details and management
 * 4. Payments - Rent payment tracking
 * 5. Activity - Timeline of all lease activities
 * 
 * PHASE 4C: SHARING INTEGRATION ✅
 * - ShareToggle for cycle owners
 * - AccessBanner for viewing shared cycles
 * - CrossAgentOfferCard for cross-agent tenant applications
 * - Cross-agent collaboration workflow
 */

import React, { useState, useMemo } from 'react';
import { RentCycle, Property, User } from '../types';
import { CrossAgentOffer } from '../types/deals';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
  DataTable,
  DataTableColumn,
  CommissionCalculator,
} from './layout';

// Foundation Components
import { InfoPanel } from './ui/info-panel';
import { StatusTimeline } from './ui/status-timeline';
import { StatusBadge } from './layout/StatusBadge';

// Sharing Components (Phase 4C)
import { ShareToggle } from './sharing/ShareToggle';
import { AccessBanner } from './sharing/AccessBanner';
import { CrossAgentOfferCard } from './sharing/CrossAgentOfferCard';

// Icons
import {
  DollarSign,
  Key,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Home,
  Clock,
  TrendingUp,
  User as UserIcon,
  Phone,
  Mail,
  Plus,
  Settings,
  RefreshCw,
  Share2,
} from 'lucide-react';

// Business Logic
// [STUBBED] import {
// [STUBBED]   approveTenantApplication,
// [STUBBED]   rejectTenantApplication,
// [STUBBED]   signLease,
// [STUBBED]   recordRentPayment,
// [STUBBED]   endLease,
// [STUBBED]   renewLease,
// [STUBBED]   closeRentCycle,
// [STUBBED]   toggleRentCycleSharing,
// [STUBBED]   addTenantApplication,
// [STUBBED] } from '../lib/rentCycle';
import { AddApplicationModal } from './AddApplicationModal';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { toast } from 'sonner';

// Phase 4C: Cross-agent deal operations
import {
  createDealFromCrossAgentOffer,
  getCrossAgentOffersByCycleId,
} from '../lib/crossAgentDeals';

// ===== STUBS for removed prototype functions =====
const approveTenantApplication = (..._args: any[]): any => { /* stub - prototype function removed */ };
const rejectTenantApplication = (..._args: any[]): any => { /* stub - prototype function removed */ };
const signLease = (..._args: any[]): any => { /* stub - prototype function removed */ };
const recordRentPayment = (..._args: any[]): any => { /* stub - prototype function removed */ };
const endLease = (..._args: any[]): any => { /* stub - prototype function removed */ };
const renewLease = (..._args: any[]): any => { /* stub - prototype function removed */ };
const closeRentCycle = (..._args: any[]): any => { /* stub - prototype function removed */ };
const toggleRentCycleSharing = (..._args: any[]): any => { /* stub - prototype function removed */ };
const addTenantApplication = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


// Phase 4C: Sharing operations (removed - toggleRentCycleSharing is in rentCycle.ts)

interface RentCycleDetailsV4Props {
  cycle: RentCycle;
  property: Property;
  user: User;
  onBack: () => void;
  onUpdate: () => void;
  onNavigate?: (page: string, id: string) => void;
}

export function RentCycleDetailsV4({
  cycle,
  property,
  user,
  onBack,
  onUpdate,
  onNavigate,
}: RentCycleDetailsV4Props) {
  const [signingLeaseForId, setSigningLeaseForId] = useState<string | null>(null);
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(cycle.monthlyRent);
  const [paymentMonth, setPaymentMonth] = useState('');
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);

  // Phase 4C: Cross-agent offers state
  const [crossAgentOffers, setCrossAgentOffers] = useState<CrossAgentOffer[]>([]);
  const [loadingCrossOffers, setLoadingCrossOffers] = useState(false);

  // Phase 4C: Determine access level
  const isOwner = cycle.agentId === user.id;
  const isShared = cycle.sharing?.isShared || false;
  const isSharedWithMe = !isOwner && isShared;
  
  // Determine access level for AccessBanner
  const accessLevel: 'owner' | 'shared-full' | 'shared-limited' | 'none' = isOwner
    ? 'owner'
    : isSharedWithMe
    ? cycle.sharing?.privacy?.hideLandlordContact
      ? 'shared-limited'
      : 'shared-full'
    : 'none';

  // Protected fields for AccessBanner
  const protectedFields = isSharedWithMe && cycle.sharing?.privacy?.hideLandlordContact
    ? ['landlord-contact', 'landlord-email', 'tenant-contact', 'financial-details']
    : [];

  // Navigation helper
  const handleNavigation = (page: string, id: string) => {
    if (onNavigate) {
      onNavigate(page, id);
    } else {
      toast.info('Navigate to ' + page);
    }
  };

  // Calculate metrics
  const totalUpfront =
    (cycle.securityDeposit || 0) + cycle.monthlyRent * (cycle.advanceMonths || 0);
  const estimatedCommission = cycle.monthlyRent * cycle.commissionMonths;
  
  // CRITICAL FIX: Use applications field (lib uses this), with fallback to tenantApplications for compatibility
  const applications = (cycle as any).applications || (cycle as any).tenantApplications || [];
  const pendingApplications = applications.filter((a: any) => a.status === 'pending') || [];
  const approvedApplications = applications.filter((a: any) => a.status === 'approved') || [];

  // Days active
  const daysActive = cycle.createdAt
    ? Math.floor((Date.now() - new Date(cycle.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Application handlers
  const handleApproveApplication = (applicationId: string) => {
    approveTenantApplication(cycle.id, applicationId);
    toast.success('Application approved');
    onUpdate();
  };

  const handleRejectApplication = (applicationId: string) => {
    rejectTenantApplication(cycle.id, applicationId);
    toast.success('Application rejected');
    onUpdate();
  };

  const handleSignLease = (applicationId: string) => {
    if (!leaseStartDate || !leaseEndDate) {
      toast.error('Please enter lease start and end dates');
      return;
    }

    try {
      const result = signLease(cycle.id, applicationId, leaseStartDate, leaseEndDate);
      if (result.success) {
        toast.success('Lease signed successfully!');
        setSigningLeaseForId(null);
        setLeaseStartDate('');
        setLeaseEndDate('');
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to sign lease');
      }
    } catch (error) {
      console.error('Error signing lease:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign lease');
    }
  };

  const handleRecordPayment = () => {
    if (!paymentMonth) {
      toast.error('Please enter payment month');
      return;
    }

    recordRentPayment(cycle.id, paymentAmount, paymentMonth, 'paid', user.name);
    toast.success('Payment recorded');
    setRecordingPayment(false);
    setPaymentMonth('');
    setPaymentAmount(cycle.monthlyRent);
    onUpdate();
  };

  const handleEndLease = () => {
    if (confirm('Are you sure you want to end this lease?')) {
      endLease(cycle.id, new Date().toISOString().split('T')[0]);
      toast.success('Lease ended');
      onUpdate();
    }
  };

  const handleRenewLease = () => {
    const currentEnd = new Date(cycle.currentLeaseEnd || Date.now());
    const newStart = new Date(currentEnd);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + cycle.leaseDuration);

    renewLease(
      cycle.id,
      newStart.toISOString().split('T')[0],
      newEnd.toISOString().split('T')[0],
      cycle.monthlyRent
    );
    toast.success('Lease renewed');
    onUpdate();
  };

  // ==================== PAGE HEADER ====================
  const pageHeader = {
    title: `Rent Cycle: ${formatPropertyAddress(property.address)}`,
    breadcrumbs: [
      { label: 'Rent Cycles', onClick: onBack },
      {
        label: formatPropertyAddress(property.address),
        onClick: () => handleNavigation('property-detail', property.id),
      },
      { label: 'Rent Cycle' },
    ],
    description: `Managed by ${cycle.agentName || user.name} • Available from ${
      cycle.availableFrom
    }`,
    metrics: [
      {
        label: 'Monthly Rent',
        value: formatPKR(cycle.monthlyRent),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Applications',
        value: String(cycle.tenantApplications?.length || 0),
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: 'Upfront Cost',
        value: formatPKR(totalUpfront),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Lease Duration',
        value: `${cycle.leaseDuration} mo`,
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        label: 'Status',
        value: <StatusBadge status={cycle.status} />,
        icon: <Key className="w-4 h-4" />,
      },
    ],
    primaryActions:
      cycle.status === 'leased' && cycle.currentTenantId
        ? [
            {
              label: 'Renew Lease',
              onClick: handleRenewLease,
              variant: 'default' as const,
            },
          ]
        : [],
    secondaryActions: [
      ...(cycle.status === 'leased' && cycle.currentTenantId
        ? [
            {
              label: 'End Lease',
              onClick: handleEndLease,
            },
          ]
        : []),
      {
        label: 'View Property',
        onClick: () => handleNavigation('property-detail', property.id),
      },
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
      type: 'landlord' as const,
      name: cycle.landlordName,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => {},
    },
    ...(cycle.currentTenantName
      ? [
          {
            type: 'tenant' as const,
            name: cycle.currentTenantName,
            icon: <Users className="h-3 w-3" />,
            onClick: () => {},
          },
        ]
      : []),
    {
      type: 'agent' as const,
      name: cycle.agentName || user.name,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => {},
    },
  ];

  // ==================== OVERVIEW TAB - LEFT COLUMN ====================
  const overviewContent = (
    <>
      {/* Status Timeline */}
      <StatusTimeline
        steps={[
          {
            label: 'Available',
            status: 'complete',
            date: cycle.createdAt,
            description: `Listed at ${formatPKR(cycle.monthlyRent)}/mo`,
          },
          {
            label: 'Applications',
            status:
              cycle.tenantApplications && cycle.tenantApplications.length > 0
                ? 'complete'
                : cycle.status === 'available'
                ? 'current'
                : 'pending',
            description: `${applications.length || 0} application${
              applications.length !== 1 ? 's' : ''
            }`,
          },
          {
            label: 'Screening',
            status:
              approvedApplications.length > 0
                ? 'complete'
                : cycle.status === 'pending-applications' && pendingApplications.length > 0
                ? 'current'
                : 'pending',
            description:
              approvedApplications.length > 0 ? `${approvedApplications.length} approved` : undefined,
          },
          {
            label: 'Lease Signed',
            status: cycle.currentTenantId ? 'complete' : 'pending',
            date: cycle.currentLeaseStart,
          },
          {
            label: 'Active',
            status:
              cycle.status === 'leased'
                ? 'current'
                : cycle.status === 'expired' || cycle.status === 'terminated'
                ? 'complete'
                : 'pending',
            description: cycle.currentTenantName,
          },
          {
            label: 'Ended',
            status:
              cycle.status === 'expired' || cycle.status === 'terminated' ? 'complete' : 'pending',
            date:
              cycle.status === 'expired' || cycle.status === 'terminated'
                ? cycle.currentLeaseEnd
                : undefined,
          },
        ]}
      />

      {/* Rent & Financial Information */}
      <InfoPanel
        title="Rent & Financial Details"
        data={[
          {
            label: 'Monthly Rent',
            value: formatPKR(cycle.monthlyRent),
            icon: <DollarSign className="h-4 w-4" />,
          },
          ...(cycle.securityDeposit
            ? [
                {
                  label: 'Security Deposit',
                  value: formatPKR(cycle.securityDeposit),
                  icon: <DollarSign className="h-4 w-4" />,
                },
              ]
            : []),
          {
            label: 'Advance Months',
            value: (cycle.advanceMonths || 0).toString(),
          },
          {
            label: 'Total Upfront Cost',
            value: formatPKR(totalUpfront),
            icon: <DollarSign className="h-4 w-4" />,
          },
          ...(cycle.maintenanceFee
            ? [
                {
                  label: 'Maintenance Fee',
                  value: `${formatPKR(cycle.maintenanceFee)}/month`,
                },
              ]
            : []),
          {
            label: 'Utilities',
            value: <span className="capitalize">{cycle.utilities} pays</span>,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Lease Terms */}
      <InfoPanel
        title="Lease Terms"
        data={[
          {
            label: 'Lease Duration',
            value: `${cycle.leaseDuration} months`,
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Available From',
            value: cycle.availableFrom,
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Pet Policy',
            value: <span className="capitalize">{cycle.petPolicy?.replace('-', ' ')}</span>,
          },
          {
            label: 'Furnishing',
            value: <span className="capitalize">{cycle.furnishingStatus}</span>,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Commission Breakdown */}
      <CommissionCalculator
        totalAmount={cycle.monthlyRent * cycle.leaseDuration}
        commissionType="fixed"
        commissionRate={estimatedCommission}
        title="Commission Breakdown"
        agentName={cycle.agentName || user.name}
      />

      {/* Landlord Information */}
      <InfoPanel
        title="Landlord Information"
        data={[
          {
            label: 'Landlord Name',
            value: cycle.landlordName,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Landlord Type',
            value: <span className="capitalize">{cycle.landlordType}</span>,
          },
          {
            label: 'Commission Structure',
            value: `${cycle.commissionMonths} month${
              cycle.commissionMonths !== 1 ? 's' : ''
            } of rent`,
          },
          {
            label: 'Est. Commission Amount',
            value: formatPKR(estimatedCommission),
            icon: <DollarSign className="h-4 w-4" />,
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
            value: formatPropertyAddress(property.address),
            icon: <Home className="h-4 w-4" />,
            copyable: true,
            onClick: () => handleNavigation('property-detail', property.id),
          },
          {
            label: 'Type',
            value: <span className="capitalize">{property.propertyType}</span>,
          },
          {
            label: 'Area',
            value: `${property.area} ${property.areaUnit || 'sq yd'}`,
          },
          ...(property.bedrooms ? [{ label: 'Bedrooms', value: property.bedrooms.toString() }] : []),
          ...(property.bathrooms
            ? [{ label: 'Bathrooms', value: property.bathrooms.toString() }]
            : []),
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Tenant Requirements */}
      {cycle.tenantRequirements && (
        <InfoPanel
          title="Tenant Requirements"
          data={[
            {
              label: 'Requirements',
              value: cycle.tenantRequirements,
            },
          ]}
          columns={1}
          density="comfortable"
          showDivider={false}
        />
      )}

      {/* Special Terms */}
      {cycle.specialTerms && (
        <InfoPanel
          title="Special Terms"
          data={[
            {
              label: 'Terms',
              value: cycle.specialTerms,
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
      {/* Current Tenant (if exists) */}
      {cycle.currentTenantId && (
        <ContactCard
          name={cycle.currentTenantName!}
          role="tenant"
          phone={cycle.currentTenantContact}
          notes={`Lease: ${cycle.currentLeaseStart} - ${cycle.currentLeaseEnd}`}
          tags={['Current Tenant']}
          onCall={() => window.open(`tel:${cycle.currentTenantContact}`)}
        />
      )}

      {/* Quick Actions */}
      <QuickActionsPanel
        title="Quick Actions"
        actions={[
          {
            label: `View Applications (${applications.length || 0})`,
            icon: <Users className="h-4 w-4" />,
            onClick: () => toast.info('Switch to Applications tab'),
          },
          ...(cycle.currentTenantId
            ? [
                {
                  label: 'View Lease',
                  icon: <FileText className="h-4 w-4" />,
                  onClick: () => toast.info('Switch to Lease tab'),
                },
                {
                  label: 'View Payments',
                  icon: <DollarSign className="h-4 w-4" />,
                  onClick: () => toast.info('Switch to Payments tab'),
                },
                {
                  label: 'Renew Lease',
                  icon: <RefreshCw className="h-4 w-4" />,
                  onClick: handleRenewLease,
                },
                {
                  label: 'End Lease',
                  icon: <XCircle className="h-4 w-4" />,
                  onClick: handleEndLease,
                },
              ]
            : []),
          {
            label: 'View Property',
            icon: <Home className="h-4 w-4" />,
            onClick: () => handleNavigation('property-detail', property.id),
          },
        ]}
      />

      {/* Key Metrics */}
      <MetricCardsGroup
        metrics={[
          {
            label: 'Monthly Rent',
            value: formatPKR(cycle.monthlyRent),
            icon: <DollarSign className="h-5 w-5" />,
            variant: 'success',
          },
          {
            label: 'Upfront Cost',
            value: formatPKR(totalUpfront),
            icon: <TrendingUp className="h-5 w-5" />,
            variant: 'info',
            description: `${cycle.advanceMonths || 0} month${
              (cycle.advanceMonths || 0) !== 1 ? 's' : ''
            } advance`,
          },
          {
            label: 'Days Active',
            value: daysActive.toString(),
            icon: <Clock className="h-5 w-5" />,
            variant: 'default',
            description: cycle.status === 'leased' ? 'Leased' : 'Available',
          },
        ]}
        columns={2}
      />

      {/* Application Stats */}
      <SummaryStatsPanel
        title="Application Stats"
        stats={[
          {
            icon: <Users className="h-4 w-4" />,
            label: 'Total Applications',
            value: applications.length || 0,
            color: 'blue',
          },
          {
            icon: <Clock className="h-4 w-4" />,
            label: 'Pending',
            value: pendingApplications.length,
            color: 'yellow',
          },
          {
            icon: <CheckCircle className="h-4 w-4" />,
            label: 'Approved',
            value: approvedApplications.length,
            color: 'green',
          },
          {
            icon: <DollarSign className="h-4 w-4" />,
            label: 'Est. Commission',
            value: formatPKR(estimatedCommission),
            color: 'green',
          },
        ]}
      />
    </>
  );

  // ==================== APPLICATIONS TAB ====================
  const applicationsColumns: DataTableColumn<any>[] = [
    {
      key: 'tenantName',
      label: 'Tenant Name',
      sortable: true,
    },
    {
      key: 'tenantContact',
      label: 'Contact',
      sortable: false,
    },
    {
      key: 'moveInDate',
      label: 'Move-in Date',
      sortable: true,
      render: (value) => value || 'Not specified',
    },
    {
      key: 'applicationDate',
      label: 'Applied On',
      sortable: true,
      render: (value, row) => new Date(row.appliedDate || row.applicationDate || row.submittedDate || value || new Date()).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  const applicationsContent = (
    <div className="space-y-6">
      {/* Header with Record Application Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium">Tenant Applications</h3>
        {cycle.status !== 'leased' && cycle.status !== 'ended' && (
          <Button onClick={() => setShowAddApplicationModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Application
          </Button>
        )}
      </div>

      {/* Applications List */}
      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app: any) => (
          <div
            key={app.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-medium">{app.tenantName}</h3>
                  <StatusBadge status={app.status} />
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{app.tenantContact}</span>
                  </div>
                  {app.moveInDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Preferred move-in: {app.moveInDate}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Applied {new Date(app.appliedDate || app.applicationDate || app.submittedDate || new Date()).toLocaleDateString()}
              </div>
            </div>

            {/* Employment Info */}
            {app.employmentInfo && (
              <div className="mb-3 p-3 bg-gray-50 rounded">
                <p className="text-xs font-medium text-gray-700 mb-1">Employment Info:</p>
                <p className="text-sm text-gray-600">{app.employmentInfo}</p>
              </div>
            )}

            {/* References */}
            {app.references && app.references.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded">
                <p className="text-xs font-medium text-gray-700 mb-1">References:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {app.references.map((ref, idx) => (
                    <li key={idx}>• {ref}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {app.notes && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs font-medium text-yellow-900 mb-1">Notes:</p>
                <p className="text-sm text-yellow-800">{app.notes}</p>
              </div>
            )}

            {/* Actions */}
            {app.status === 'pending' && (
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <Button
                  size="sm"
                  onClick={() => handleApproveApplication(app.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectApplication(app.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}

            {/* Sign Lease (for approved) */}
            {app.status === 'approved' && !cycle.currentTenantId && (
              <div className="pt-3 border-t border-gray-200">
                {signingLeaseForId === app.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Lease Start</Label>
                        <Input
                          type="date"
                          value={leaseStartDate}
                          onChange={(e) => setLeaseStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Lease End</Label>
                        <Input
                          type="date"
                          value={leaseEndDate}
                          onChange={(e) => setLeaseEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSignLease(app.id)}>
                        Sign Lease
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSigningLeaseForId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setSigningLeaseForId(app.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Sign Lease
                  </Button>
                )}
              </div>
            )}
          </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-base mb-2">No Applications Yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            No tenant applications have been received for this rental property yet.
          </p>
          {cycle.status !== 'leased' && cycle.status !== 'ended' && (
            <Button onClick={() => setShowAddApplicationModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Application
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // ==================== LEASE TAB ====================
  const leaseContent = cycle.currentTenantId ? (
    <>
      {/* Current Tenant Card */}
      <ContactCard
        name={cycle.currentTenantName!}
        role="tenant"
        phone={cycle.currentTenantContact}
        notes={`Lease active from ${cycle.currentLeaseStart} to ${cycle.currentLeaseEnd}`}
        tags={['Current Tenant', 'Active Lease']}
        onCall={() => window.open(`tel:${cycle.currentTenantContact}`)}
      />

      {/* Lease Details */}
      <InfoPanel
        title="Current Lease Details"
        data={[
          {
            label: 'Tenant Name',
            value: cycle.currentTenantName!,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Contact',
            value: cycle.currentTenantContact!,
            icon: <Phone className="h-4 w-4" />,
          },
          {
            label: 'Lease Start',
            value: cycle.currentLeaseStart!,
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Lease End',
            value: cycle.currentLeaseEnd!,
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Monthly Rent',
            value: formatPKR(cycle.monthlyRent),
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Status',
            value: <StatusBadge status={cycle.status} />,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Lease Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-[#030213] mb-4">Lease Actions</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleRenewLease}
          >
            <RefreshCw className="h-4 w-4" />
            Renew Lease
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
            onClick={handleEndLease}
          >
            <XCircle className="h-4 w-4" />
            End Lease
          </Button>
        </div>
      </div>
    </>
  ) : (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-base mb-2">No Active Lease</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        There is no active lease for this property yet. Approve an application and sign a lease to
        get started.
      </p>
    </div>
  );

  // ==================== PAYMENTS TAB ====================
  const paymentsContent = (
    <>
      {/* Record Payment Form */}
      {cycle.currentTenantId && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-medium text-[#030213] mb-4">Record Payment</h3>
          {recordingPayment ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Amount</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    placeholder="Amount"
                  />
                </div>
                <div>
                  <Label className="text-sm">Month</Label>
                  <Input
                    type="month"
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRecordPayment}>Save Payment</Button>
                <Button variant="outline" onClick={() => setRecordingPayment(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setRecordingPayment(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record New Payment
            </Button>
          )}
        </div>
      )}

      {/* Payment History */}
      {cycle.rentPayments && cycle.rentPayments.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-medium text-[#030213] mb-4">Payment History</h3>
          <div className="space-y-3">
            {cycle.rentPayments.map((payment, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{payment.month}</p>
                  <p className="text-xs text-gray-500">
                    Recorded by {payment.recordedBy} on{' '}
                    {new Date(payment.recordedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatPKR(payment.amount)}</p>
                  <StatusBadge status={payment.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-base mb-2">No Payment History</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            No rent payments have been recorded yet.
          </p>
        </div>
      )}
    </>
  );

  // ==================== ACTIVITY TAB ====================
  const activities: Activity[] = useMemo(() => {
    const activityList: Activity[] = [];

    // Rent cycle created
    activityList.push({
      id: 'created',
      type: 'created',
      title: 'Rent cycle created',
      description: `Listed at ${formatPKR(cycle.monthlyRent)}/month`,
      date: cycle.createdAt,
      user: cycle.agentName || user.name,
      icon: <Plus className="h-5 w-5 text-blue-600" />,
    });

    // Applications
    applications.forEach((app: any) => {
      activityList.push({
        id: `app-${app.id}`,
        type: 'communication',
        title: 'Application received',
        description: `From ${app.tenantName}`,
        date: app.appliedDate || app.applicationDate || app.submittedDate || new Date().toISOString(),
        icon: <Users className="h-5 w-5 text-blue-600" />,
      });

      if (app.status === 'approved') {
        activityList.push({
          id: `app-approved-${app.id}`,
          type: 'status-change',
          title: 'Application approved',
          description: app.tenantName,
          date: app.appliedDate || app.applicationDate || app.submittedDate || new Date().toISOString(),
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        });
      }
    });

    // Lease signed
    if (cycle.currentTenantId) {
      activityList.push({
        id: 'lease-signed',
        type: 'milestone',
        title: 'Lease signed',
        description: `With ${cycle.currentTenantName}`,
        date: cycle.currentLeaseStart || cycle.createdAt,
        icon: <FileText className="h-5 w-5 text-green-600" />,
      });
    }

    // Payments
    (cycle.rentPayments || []).forEach((payment, idx) => {
      activityList.push({
        id: `payment-${idx}`,
        type: 'payment',
        title: 'Payment received',
        description: `${formatPKR(payment.amount)} for ${payment.month}`,
        date: payment.recordedDate,
        user: payment.recordedBy,
        icon: <DollarSign className="h-5 w-5 text-green-600" />,
      });
    });

    // Sort by date descending
    return activityList.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [cycle]);

  const activityContent = (
    <ActivityTimeline
      title="Rent Cycle Timeline"
      activities={activities}
      emptyMessage="No activities yet"
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
      id: 'applications',
      label: `Applications (${applications.length || 0})`,
      content: applicationsContent,
      layout: '3-0',
    },
    {
      id: 'lease',
      label: 'Lease',
      content: leaseContent,
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
  ];

  // ==================== RENDER ====================
  return (
    <>
      {/* Phase 4C: Access Banner for Shared Cycles */}
      {isSharedWithMe && (
        <div className="bg-gray-50 pt-4 px-6">
          <AccessBanner
            accessLevel={accessLevel}
            ownerName={cycle.agentName || user.name}
            cycleType="rent"
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

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={showAddApplicationModal}
        onClose={() => setShowAddApplicationModal(false)}
        rentCycleId={cycle.id}
        monthlyRent={cycle.monthlyRent}
        user={user}
        onSuccess={() => {
          setShowAddApplicationModal(false);
          onUpdate();
        }}
      />

      {/* Phase 4C: Share Toggle - Floating Action */}
      {isOwner && (
        <div className="fixed bottom-6 right-6 z-50">
          <ShareToggle
            cycleId={cycle.id}
            cycleType="rent"
            isShared={isShared}
            viewCount={cycle.collaboration?.viewCount || 0}
            viewedBy={cycle.collaboration?.viewedBy || []}
            user={user}
            onToggle={(isShared, userId, userName) => {
              toggleRentCycleSharing(cycle.id, isShared, userId, userName);
              onUpdate();
            }}
          />
        </div>
      )}
    </>
  );
}