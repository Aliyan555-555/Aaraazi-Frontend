"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertyDetails } from '@/components/PropertyDetails';
import { mapAuthUserToUIUser } from '@/types';
import type { SellCycle } from '@/types';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalLoadingScreen } from '@/components/ui/GlobalLoadingScreen';
import { toast } from 'sonner';
import { useProperty, usePropertyMutations } from '@/hooks/useProperties';
import { useSellCycles } from '@/hooks/useSellCycles';

function mapSellCycleApiToUI(api: {
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

export default function PropertyDetailPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const { property, isLoading, error } = useProperty(id as string | undefined);
    const { remove } = usePropertyMutations();
    const { cycles: sellCyclesApi } = useSellCycles(property?.id);

    const sellCycles: SellCycle[] = useMemo(
        () => (sellCyclesApi || []).map(mapSellCycleApiToUI),
        [sellCyclesApi]
    );

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (isLoading) {
        return (
            <GlobalLoadingScreen
                message="Loading property details..."
                className="h-[calc(100vh-4rem)]"
                size="lg"
            />
        );
    }

    if (error || !property || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Property</h3>
                    <p className="text-red-700 mb-6">{error || 'Property not found or access denied'}</p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/properties')}
                        >
                            Back to Properties
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PropertyDetails
            property={property}
            sellCycles={sellCycles}
            purchaseCycles={[]}
            rentCycles={[]}
            user={user}
            onBack={() => router.push('/dashboard/properties')}
            onEdit={() => router.push(`/dashboard/properties/${id}/edit`)}
            onStartSellCycle={() => {
                sessionStorage.setItem('cycle_property_id', property.id);
                router.push('/dashboard/sell-cycles/new');
            }}
            onStartPurchaseCycle={() => {
                sessionStorage.setItem('cycle_property_id', property.id);
                router.push('/dashboard/purchase-cycles/new');
            }}
            onStartRentCycle={() => {
                sessionStorage.setItem('cycle_property_id', property.id);
                router.push('/dashboard/rent-cycles/new');
            }}
            onDelete={async () => {
                if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
                    try {
                        await remove(property.id);
                        toast.success('Property deleted successfully');
                        router.push('/dashboard/properties');
                    } catch (err: unknown) {
                        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to delete property';
                        toast.error(msg);
                    }
                }
            }}
            onViewCycle={(cycleId, type) => {
                router.push(`/dashboard/${type}-cycles/${cycleId}`);
            }}
        />
    );
}

