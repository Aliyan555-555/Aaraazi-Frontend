"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PurchaseCycleForm } from '@/components/PurchaseCycleForm';
import { mapAuthUserToUIUser } from '@/types';
import { useProperty } from '@/hooks/useProperties';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewPurchaseCyclePage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();
    const [propertyId, setPropertyId] = useState<string | null>(null);

    useEffect(() => {
        const storedId = sessionStorage.getItem('cycle_property_id');
        if (storedId) {
            setPropertyId(storedId);
        }
    }, []);

    const { property, isLoading, error } = useProperty(propertyId ?? undefined, !!propertyId);
    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!propertyId) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 flex flex-col items-center max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Property Selected</h3>
                    <p className="text-yellow-700 mb-6">Please select a property first to start a purchase cycle.</p>
                    <Button onClick={() => router.push('/dashboard/properties')}>
                        Go to Properties
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading property details...</p>
            </div>
        );
    }

    if (error || !property || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Property</h3>
                    <p className="text-red-700 mb-6">{error || 'Property not found or access denied'}</p>
                    <Button variant="outline" onClick={() => router.push('/dashboard/properties')}>
                        Back to Properties
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <PurchaseCycleForm
            property={property}
            user={user}
            onBack={() => {
                sessionStorage.removeItem('cycle_property_id');
                router.push(`/dashboard/properties/${propertyId}`);
            }}
            onSuccess={() => {
                sessionStorage.removeItem('cycle_property_id');
                router.push(`/dashboard/properties/${propertyId}`);
            }}
        />
    );
}
