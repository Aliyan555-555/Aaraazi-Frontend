"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { SellCycleDetailsV4 } from '@/components/SellCycleDetailsV4';
import { mapAuthUserToUIUser } from '@/types';
import type { SellCycle } from '@/types';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalLoadingScreen } from '@/components/ui/GlobalLoadingScreen';
import { useSellCycle } from '@/hooks/useSellCycles';
import { useProperty } from '@/hooks/useProperties';

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

const routeMap: Record<string, string> = {
  'property-detail': 'properties',
  'deal-detail': 'deals',
  'contact-detail': 'contacts',
};

export default function SellCycleDetailPage() {
  const { id } = useParams();
  const { user: saasUser } = useAuthStore();
  const router = useRouter();

  const { cycle: cycleApi, isLoading: cycleLoading, error: cycleError, refetch } = useSellCycle(
    id as string | undefined
  );
  const { property, isLoading: propertyLoading, error: propertyError } = useProperty(
    cycleApi?.propertyListingId,
    !!cycleApi?.propertyListingId
  );

  const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);
  const cycle = useMemo(
    () => (cycleApi ? mapApiCycleToSellCycle(cycleApi) : null),
    [cycleApi]
  );

  const handleNavigate = (page: string, navigateId: string) => {
    const section = routeMap[page] ?? page;
    router.push(`/dashboard/${section}/${navigateId}`);
  };

  if (!id || typeof id !== 'string') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <p className="text-gray-700 font-medium mb-4">Invalid sell cycle</p>
        <Button onClick={() => router.push('/dashboard/sell-cycles')}>
          Back to Sell Cycles
        </Button>
      </div>
    );
  }

  if (cycleLoading || (cycleApi && propertyLoading)) {
    return (
      <GlobalLoadingScreen
        message="Loading sell cycle..."
        className="h-[calc(100vh-4rem)]"
        size="lg"
      />
    );
  }

  if (cycleError || !cycle) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Sell cycle not found</h3>
          <p className="text-red-700 mb-6">
            {cycleError || 'This sell cycle may have been removed or you don’t have access.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/sell-cycles')}>
              Back to Sell Cycles
            </Button>
            <Button onClick={() => refetch()}>Try again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (propertyLoading && !property) {
    return (
      <GlobalLoadingScreen
        message="Loading property..."
        className="h-[calc(100vh-4rem)]"
        size="lg"
      />
    );
  }

  if (propertyError || !property || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex flex-col items-center max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-amber-900 mb-2">Property unavailable</h3>
          <p className="text-amber-700 mb-6">
            {propertyError || 'The property linked to this sell cycle could not be loaded.'}
          </p>
          <Button onClick={() => router.push('/dashboard/sell-cycles')}>
            Back to Sell Cycles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SellCycleDetailsV4
      cycle={cycle}
      property={property}
      user={user}
      onBack={() => router.push(`/dashboard/properties/${cycle.propertyId}`)}
      onUpdate={() => refetch()}
      onNavigate={handleNavigate}
    />
  );
}
