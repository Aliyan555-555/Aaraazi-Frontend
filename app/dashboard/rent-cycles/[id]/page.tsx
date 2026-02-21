"use client";

import React, { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { mapAuthUserToUIUser } from '@/types';
import { useRentCycle, useUpdateRentCycle } from '@/hooks/useRentCycles';
import { GlobalLoadingScreen } from '@/components/ui/GlobalLoadingScreen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AddApplicationModal } from '@/components/rent-cycles/AddApplicationModal';
import { ApproveApplicationModal } from '@/components/rent-cycles/ApproveApplicationModal';
import { SignLeaseModal } from '@/components/rent-cycles/SignLeaseModal';
import { RecordRentPaymentModal } from '@/components/rent-cycles/RecordRentPaymentModal';
import {
  AlertCircle,
  ArrowLeft,
  Home,
  User,
  CalendarDays,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Zap,
  FileText,
  ChevronRight,
  Building2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  LISTED: 'Listed',
  AVAILABLE: 'Available',
  SHOWING: 'Showing',
  APPLICATION_RECEIVED: 'Application Received',
  LEASED: 'Leased',
  ACTIVE: 'Active',
  RENEWAL_PENDING: 'Renewal Pending',
  ENDING: 'Ending',
  ENDED: 'Ended',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  LISTED: 'secondary',
  AVAILABLE: 'default',
  SHOWING: 'default',
  APPLICATION_RECEIVED: 'default',
  LEASED: 'default',
  ACTIVE: 'default',
  RENEWAL_PENDING: 'secondary',
  ENDING: 'destructive',
  ENDED: 'outline',
  CANCELLED: 'destructive',
  ON_HOLD: 'secondary',
};

/** CSS colour classes per status for the coloured pill */
const STATUS_COLOUR: Record<string, string> = {
  LISTED: 'bg-blue-100 text-blue-800',
  AVAILABLE: 'bg-green-100 text-green-800',
  SHOWING: 'bg-indigo-100 text-indigo-800',
  APPLICATION_RECEIVED: 'bg-yellow-100 text-yellow-800',
  LEASED: 'bg-teal-100 text-teal-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  RENEWAL_PENDING: 'bg-orange-100 text-orange-800',
  ENDING: 'bg-red-100 text-red-800',
  ENDED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
  ON_HOLD: 'bg-gray-100 text-gray-600',
};

/**
 * The allowed status transitions from each status.
 * Mirrors the prototype workflow from rentCycle.ts.
 */
const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  LISTED: [{ value: 'AVAILABLE', label: 'Mark Available' }],
  AVAILABLE: [{ value: 'SHOWING', label: 'Start Showing' }],
  SHOWING: [{ value: 'APPLICATION_RECEIVED', label: 'Application Received' }],
  APPLICATION_RECEIVED: [
    { value: 'LEASED', label: 'Mark as Leased' },
    { value: 'AVAILABLE', label: 'Back to Available' },
  ],
  LEASED: [{ value: 'ACTIVE', label: 'Activate Lease' }],
  ACTIVE: [
    { value: 'RENEWAL_PENDING', label: 'Renewal Pending' },
    { value: 'ENDING', label: 'Mark as Ending' },
  ],
  RENEWAL_PENDING: [
    { value: 'ACTIVE', label: 'Renew — Mark Active' },
    { value: 'ENDING', label: 'Not Renewed — Ending' },
  ],
  ENDING: [{ value: 'ENDED', label: 'Mark as Ended' }],
  ENDED: [{ value: 'AVAILABLE', label: 'Re-list as Available' }],
};

// ─────────────────────────────────────────────────────────────
// Helper: format currency
// ─────────────────────────────────────────────────────────────
function formatPKR(value: string | number | null | undefined): string {
  if (value == null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="text-gray-500">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 pr-4">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

function BooleanField({ label, value }: { label: string; value: boolean }) {
  return (
    <FieldRow
      label={label}
      value={
        value ? (
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Yes
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-400">
            <XCircle className="h-3.5 w-3.5" /> No
          </span>
        )
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function RentCycleDetailPage() {
  const { id } = useParams();
  const { user: saasUser } = useAuthStore();
  const router = useRouter();
  const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

  const cycleId = typeof id === 'string' ? id : undefined;
  const { cycle, isLoading, error, refetch } = useRentCycle(cycleId);
  const { update: updateCycle, isLoading: isUpdating } = useUpdateRentCycle();

  // Modal state
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSignLeaseModal, setShowSignLeaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ── Status transition ──────────────────────────────────────
  const handleStatusChange = async (newStatus: string) => {
    if (!cycleId) return;
    try {
      await updateCycle(cycleId, { status: newStatus });
      toast.success(`Status updated to ${STATUS_LABELS[newStatus] ?? newStatus}`);
      refetch();
    } catch {
      toast.error('Failed to update status. Please try again.');
    }
  };

  // ── Guard: invalid ID ──────────────────────────────────────
  if (!cycleId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <p className="text-gray-700 font-medium mb-4">Invalid rent cycle ID</p>
        <Button onClick={() => router.push('/dashboard/rent-cycles')}>
          Back to Rent Cycles
        </Button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <GlobalLoadingScreen
        message="Loading rent cycle..."
        className="h-[calc(100vh-4rem)]"
        size="lg"
      />
    );
  }

  // ── Error / not found ──────────────────────────────────────
  if (error || !cycle) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Rent cycle not found</h3>
          <p className="text-red-700 mb-6">
            {error ?? "This rent cycle may have been removed or you don't have access."}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/rent-cycles')}>
              Back to Rent Cycles
            </Button>
            <Button onClick={refetch}>Try again</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────
  const statusLabel = STATUS_LABELS[cycle.status] ?? cycle.status;
  const statusColour = STATUS_COLOUR[cycle.status] ?? 'bg-gray-100 text-gray-600';
  const nextStatuses = NEXT_STATUSES[cycle.status] ?? [];

  const propertyTitle =
    cycle.propertyListing?.title ?? 'Property';
  const address = cycle.propertyListing?.masterProperty?.address;
  const cityName = address?.city?.name ?? '';
  const areaName = address?.area?.name ?? '';
  const propertyLocation = [areaName, cityName].filter(Boolean).join(', ') || '—';
  const propertyType = cycle.propertyListing?.masterProperty?.type ?? '—';

  const activeLease = cycle.leases?.find((l) => l.status === 'ACTIVE');
  const pendingOffers = (cycle.offers ?? []).filter((o) => o.status === 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ───────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/rent-cycles')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rent Cycles
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Lease workflow action buttons */}
          {(cycle.status === 'LISTED' || cycle.status === 'SHOWING' || cycle.status === 'AVAILABLE') && (
            <Button
              size="sm"
              onClick={() => setShowAddApplicationModal(true)}
            >
              Add Application
            </Button>
          )}
          {cycle.status === 'APPLICATION_RECEIVED' && (
            <Button
              size="sm"
              onClick={() => setShowApproveModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Application
            </Button>
          )}
          {cycle.status === 'APPLICATION_RECEIVED' && (
            <Button
              size="sm"
              onClick={() => setShowSignLeaseModal(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Sign Lease
            </Button>
          )}
          {(cycle.status === 'LEASED' || cycle.status === 'ACTIVE') && (
            <Button
              size="sm"
              onClick={() => setShowPaymentModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Record Payment
            </Button>
          )}

          {/* Status transition buttons */}
          {nextStatuses.map((ns) => (
            <Button
              key={ns.value}
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(ns.value)}
              disabled={isUpdating}
            >
              {ns.label}
            </Button>
          ))}
          {cycle.propertyListingId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/properties/${cycle.propertyListingId}`)
              }
            >
              View Property
            </Button>
          )}
        </div>
      </div>

      {/* ── Hero header ───────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColour}`}>
                  {statusLabel}
                </span>
                <span className="text-sm text-gray-400 font-mono">{cycle.cycleNumber}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{propertyTitle}</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {propertyLocation} &middot; {propertyType}
              </p>
            </div>

            {/* Monthly rent highlight */}
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-gray-900">
                {formatPKR(cycle.monthlyRent)}
              </div>
              <div className="text-sm text-gray-500">per month</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content grid ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial summary */}
          <DetailCard title="Financial Details" icon={<DollarSign className="h-4 w-4" />}>
            <FieldRow label="Monthly Rent" value={formatPKR(cycle.monthlyRent)} />
            <FieldRow
              label="Security Deposit"
              value={cycle.securityDeposit ? formatPKR(cycle.securityDeposit) : '—'}
            />
            <FieldRow label="Rent Due Day" value={`${cycle.rentDueDay}${cycle.rentDueDay === 1 ? 'st' : cycle.rentDueDay === 2 ? 'nd' : cycle.rentDueDay === 3 ? 'rd' : 'th'} of month`} />
          </DetailCard>

          {/* Lease terms */}
          <DetailCard title="Lease Terms" icon={<CalendarDays className="h-4 w-4" />}>
            <FieldRow label="Lease Period" value={`${cycle.leasePeriod} month${cycle.leasePeriod !== 1 ? 's' : ''}`} />
            {cycle.minimumLeasePeriod != null && (
              <FieldRow
                label="Minimum Lease Period"
                value={`${cycle.minimumLeasePeriod} month${cycle.minimumLeasePeriod !== 1 ? 's' : ''}`}
              />
            )}
            <FieldRow label="Available From" value={formatDate(cycle.availableFrom)} />
          </DetailCard>

          {/* Utilities & maintenance */}
          <DetailCard title="Utilities & Maintenance" icon={<Zap className="h-4 w-4" />}>
            <BooleanField label="Utilities Included" value={cycle.utilitiesIncluded} />
            <BooleanField label="Maintenance Included" value={cycle.maintenanceIncluded} />
            {cycle.maintenanceResponsibility && (
              <FieldRow
                label="Maintenance Responsibility"
                value={cycle.maintenanceResponsibility}
              />
            )}
          </DetailCard>

          {/* Active lease */}
          {activeLease && (
            <DetailCard title="Active Lease" icon={<FileText className="h-4 w-4" />}>
              <FieldRow label="Lease Number" value={activeLease.leaseNumber} />
              <FieldRow label="Tenant" value={activeLease.tenantContact?.name ?? '—'} />
              {activeLease.tenantContact?.phone && (
                <FieldRow label="Tenant Phone" value={activeLease.tenantContact.phone} />
              )}
              <FieldRow label="Start Date" value={formatDate(activeLease.startDate)} />
              <FieldRow label="End Date" value={formatDate(activeLease.endDate)} />
              <FieldRow label="Monthly Rent" value={formatPKR(activeLease.monthlyRent)} />
              <FieldRow
                label="Status"
                value={
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                    {activeLease.status}
                  </span>
                }
              />
            </DetailCard>
          )}

          {/* Offers */}
          {(cycle.offers?.length ?? 0) > 0 && (
            <DetailCard
              title={`Offers (${cycle.offers!.length})`}
              icon={<FileText className="h-4 w-4" />}
            >
              <div className="space-y-3">
                {cycle.offers!.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {offer.buyer?.name ?? 'Unknown buyer'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatPKR(offer.amount)} &middot; {formatDate(offer.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        offer.status === 'ACCEPTED'
                          ? 'bg-green-100 text-green-700'
                          : offer.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {offer.status}
                    </span>
                  </div>
                ))}
              </div>
            </DetailCard>
          )}
        </div>

        {/* Right column — meta */}
        <div className="space-y-6">
          {/* Agent */}
          <DetailCard title="Agent" icon={<User className="h-4 w-4" />}>
            <div className="flex items-center gap-3 py-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-semibold text-sm">
                  {(cycle.agent?.name ?? 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{cycle.agent?.name ?? '—'}</p>
                <p className="text-xs text-gray-500">{cycle.agent?.email ?? '—'}</p>
              </div>
            </div>
          </DetailCard>

          {/* Metadata */}
          <DetailCard title="Cycle Info" icon={<Clock className="h-4 w-4" />}>
            <FieldRow label="Cycle Number" value={<span className="font-mono">{cycle.cycleNumber}</span>} />
            <FieldRow label="Status" value={<span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColour}`}>{statusLabel}</span>} />
            <FieldRow label="Published" value={cycle.isPublished ? 'Yes' : 'No'} />
            <FieldRow label="Created" value={formatDate(cycle.createdAt)} />
            <FieldRow label="Updated" value={formatDate(cycle.updatedAt)} />
          </DetailCard>

          {/* Quick stats */}
          <DetailCard title="Summary" icon={<Home className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-700">{cycle.offers?.length ?? 0}</div>
                <div className="text-xs text-blue-600 mt-0.5">Total Offers</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-700">{cycle.leases?.length ?? 0}</div>
                <div className="text-xs text-emerald-600 mt-0.5">Total Leases</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-700">{pendingOffers.length}</div>
                <div className="text-xs text-yellow-600 mt-0.5">Pending Offers</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-700">{cycle.leasePeriod}</div>
                <div className="text-xs text-purple-600 mt-0.5">Month Lease</div>
              </div>
            </div>
          </DetailCard>
        </div>
      </div>

      {/* Lease Management Modals */}
      {showAddApplicationModal && cycleId && (
        <AddApplicationModal
          rentCycleId={cycleId}
          onClose={() => setShowAddApplicationModal(false)}
          onSuccess={() => { setShowAddApplicationModal(false); refetch(); }}
        />
      )}

      {showApproveModal && cycleId && (
        <ApproveApplicationModal
          rentCycleId={cycleId}
          applications={(cycle.offers ?? []) as any}
          onClose={() => setShowApproveModal(false)}
          onSuccess={() => { setShowApproveModal(false); refetch(); }}
        />
      )}

      {showSignLeaseModal && cycleId && (
        <SignLeaseModal
          rentCycleId={cycleId}
          leasePeriod={cycle.leasePeriod}
          applications={(cycle.offers ?? []) as any}
          onClose={() => setShowSignLeaseModal(false)}
          onSuccess={() => { setShowSignLeaseModal(false); refetch(); }}
        />
      )}

      {showPaymentModal && cycleId && (
        <RecordRentPaymentModal
          rentCycleId={cycleId}
          monthlyRent={cycle.monthlyRent}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => { setShowPaymentModal(false); refetch(); }}
        />
      )}
    </div>
  );
}
