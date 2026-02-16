"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertyForm } from '@/components/PropertyForm';
import { AcquisitionTypeSelector } from '@/components/AcquisitionTypeSelector';
import { User, mapAuthUserToUIUser } from '@/types';
import { toast } from 'sonner';

export default function NewPropertyPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();
    const [acquisitionType, setAcquisitionType] = useState<'client-listing' | 'agency-purchase' | 'investor-purchase' | null>(null);

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!acquisitionType) {
        return (
            <div className="p-6">
                <AcquisitionTypeSelector
                    onSelect={(type) => setAcquisitionType(type as any)}
                    onBack={() => router.push('/dashboard/properties')}
                />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PropertyForm
                user={user}
                acquisitionType={acquisitionType}
                onBack={() => setAcquisitionType(null)}
                onSuccess={() => {
                    toast.success('Property added successfully!');
                    router.push('/dashboard/properties');
                }}
            />
        </div>
    );
}
