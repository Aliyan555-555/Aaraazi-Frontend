"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PurchaseCycleDetails } from '@/components/PurchaseCycleDetails';
import { mapAuthUserToUIUser } from '@/types';
import type { PurchaseCycle, Property } from '@/types';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalLoadingScreen } from '@/components/ui/GlobalLoadingScreen';
import { usePurchaseCycle } from '@/hooks/usePurchaseCycles';
import { useProperty } from '@/hooks/useProperties';

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
  propertyListingId?: string | null;
  requirement?: { id: string; contact?: { name: string } };
  propertyListing?: { id: string; title: string; propertyType?: string };
  agent?: { id: string; name: string; email: string };
  offers?: Array<{ id: string; amount?: number; status?: string; buyer?: { name: string } }>;
  deals?: Array<{ id: string }>;
}): PurchaseCycle {
  const statusMap: Record<string, string> = {
    ACTIVE: 'prospecting',
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    ON_HOLD: 'on-hold',
    NEGOTIATION: 'negotiation',
    UNDER_CONTRACT: 'under-contract',
    OFFER_RECEIVED: 'offer-made',
    SOLD: 'acquired',
  };
  const topOffer = api.offers?.[0];
  const linkedDealId = api.deals?.[0]?.id;
  return {
    id: api.id,
    propertyId: api.propertyListingId ?? '',
    agentId: api.agentId,
    agentName: api.agent?.name,
    status: (statusMap[api.status] || api.status.toLowerCase().replace(/_/g, '-')) as PurchaseCycle['status'],
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    createdBy: api.createdBy ?? api.agentId,
    title: `Purchase ${api.cycleNumber}`,
    buyerRequirementId: api.requirementId,
    purchaserName: api.requirement?.contact?.name ?? '',
    purchaserType: 'client',
    offerAmount: topOffer?.amount ?? 0,
    negotiatedPrice: topOffer?.amount,
    offerDate: api.startDate,
    linkedDealId,
    createdDealId: linkedDealId,
  };
}

function placeholderProperty(cycle: PurchaseCycle, listingTitle?: string): Property {
  const now = new Date().toISOString();
  return {
    id: cycle.propertyId || '',
    title: listingTitle ?? (cycle.purchaserName ? `Requirement: ${cycle.purchaserName}` : 'Requirement'),
    address: cycle.purchaserName ? `Buyer: ${cycle.purchaserName}` : (listingTitle ?? 'No property linked'),
    area: 0,
    areaUnit: 'sqft',
    propertyType: 'house',
    price: 0,
    status: 'available',
    agentId: cycle.agentId,
    agentName: cycle.agentName,
    createdBy: cycle.createdBy ?? cycle.agentId,
    sharedWith: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
}

const routeMap: Record<string, string> = {
  'property-detail': 'properties',
  'deal-detail': 'deals',
  'contact-detail': 'contacts',
};

export default function PurchaseCycleDetailPage() {
  const { id } = useParams();
  const { user: saasUser } = useAuthStore();
  const router = useRouter();
  const { cycle: cycleApi, isLoading, error, refetch } = usePurchaseCycle(id as string | undefined);
  const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

  const cycle = useMemo(() => (cycleApi ? mapApiToPurchaseCycle(cycleApi) : null), [cycleApi]);
  const propertyListingId = cycleApi?.propertyListingId ?? cycle?.propertyId;
  const { property: fetchedProperty } = useProperty(
    propertyListingId && propertyListingId !== '' ? propertyListingId : undefined
  );
  const property = useMemo(() => {
    if (!cycle) return null;
    if (fetchedProperty) return fetchedProperty;
    return placeholderProperty(cycle, cycleApi?.propertyListing?.title);
  }, [cycle, fetchedProperty, cycleApi?.propertyListing?.title]);

  const handleNavigate = (page: string, navigateId: string) => {
    const section = routeMap[page] ?? page;
    router.push(`/dashboard/${section}/${navigateId}`);
  };

  if (!id || typeof id !== 'string') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <p className="text-gray-700 font-medium mb-4">Invalid purchase cycle</p>
        <Button onClick={() => router.push('/dashboard/purchase-cycles')}>
          Back to Purchase Cycles
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <GlobalLoadingScreen
        message="Loading purchase cycle..."
        className="h-[calc(100vh-4rem)]"
        size="lg"
      />
    );
  }

  if (error || !cycle || !user || !property) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Purchase cycle not found</h3>
          <p className="text-red-700 mb-6">
            {error || 'This purchase cycle may have been removed or you don’t have access.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/purchase-cycles')}>
              Back to Purchase Cycles
            </Button>
            <Button onClick={() => refetch()}>Try again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PurchaseCycleDetails
      cycle={cycle}
      property={property}
      user={user}
      onBack={() => router.push('/dashboard/purchase-cycles')}
      onUpdate={() => refetch()}
      onNavigate={handleNavigate}
    />
  );
}
