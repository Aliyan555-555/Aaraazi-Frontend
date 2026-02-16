"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertyDetails } from '@/components/PropertyDetails';
// [STUBBED] import { getPropertyById } from '@/lib/data';
// [STUBBED] import { getSellCycles } from '@/lib/sellCycle';
// [STUBBED] import { getPurchaseCycles } from '@/lib/purchaseCycle';
// [STUBBED] import { getRentCycles } from '@/lib/rentCycle';
import { mapAuthUserToUIUser, Property, SellCycle, PurchaseCycle, RentCycle } from '@/types';

// ===== STUBS for removed prototype functions =====
const getPropertyById = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getSellCycles = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getPurchaseCycles = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getRentCycles = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


export default function PropertyDetailPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const data = useMemo(() => {
        if (!id || typeof id !== 'string' || !saasUser) return null;

        const user = mapAuthUserToUIUser(saasUser);
        if (!user) return null;

        const property = getPropertyById(id);
        if (!property) return null;

        const sellCycles = getSellCycles(user.role === 'admin' ? undefined : user.id, user.role)
            .filter((c: SellCycle) => c.propertyId === id);
        const purchaseCycles = getPurchaseCycles(user.role === 'admin' ? undefined : user.id, user.role)
            .filter((c: PurchaseCycle) => c.propertyId === id);
        const rentCycles = getRentCycles(user.role === 'admin' ? undefined : user.id, user.role)
            .filter((c: RentCycle) => c.propertyId === id);

        return { property, sellCycles, purchaseCycles, rentCycles, user };
    }, [id, saasUser]);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 mb-4">Property not found</p>
                <button
                    onClick={() => router.push('/dashboard/properties')}
                    className="text-blue-600 hover:underline"
                >
                    Back to Properties
                </button>
            </div>
        );
    }

    const handleNavigate = (section: string, navigateId?: string) => {
        if (navigateId) {
            router.push(`/dashboard/${section}/${navigateId}`);
        } else {
            router.push(`/dashboard/${section}`);
        }
    };

    return (
        <PropertyDetails
            property={data.property}
            sellCycles={data.sellCycles}
            purchaseCycles={data.purchaseCycles}
            rentCycles={data.rentCycles}
            user={data.user}
            onBack={() => router.push('/dashboard/properties')}
            onEdit={() => router.push(`/dashboard/properties/${id}/edit`)}
            onStartSellCycle={() => {
                sessionStorage.setItem('cycle_property_id', data.property.id);
                router.push('/dashboard/sell-cycles/new');
            }}
            onStartPurchaseCycle={() => {
                sessionStorage.setItem('cycle_property_id', data.property.id);
                router.push('/dashboard/purchase-cycles/new');
            }}
            onStartRentCycle={() => {
                sessionStorage.setItem('cycle_property_id', data.property.id);
                router.push('/dashboard/rent-cycles/new');
            }}
            onViewCycle={(cycleId, type) => {
                router.push(`/dashboard/${type}-cycles/${cycleId}`);
            }}
        />
    );
}

