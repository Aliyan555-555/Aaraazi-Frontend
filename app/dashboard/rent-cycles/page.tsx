"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { RentCyclesWorkspace } from '@/components/rent-cycles/RentCyclesWorkspace';
import { User, mapAuthUserToUIUser, RentCycle } from '@/types';
import { RentCycleApiResponse } from '@/services/rent-cycles.service';

export default function RentCyclesPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (section: string, id?: string) => {
        if (section === 'rent-cycle-details' && id) {
            router.push(`/dashboard/rent-cycles/${id}`);
        } else if (id) {
            router.push(`/dashboard/${section}/${id}`);
        } else {
            router.push(`/dashboard/${section}`);
        }
    };

    // Navigate to the properties page to pick a property first
    const handleStartNew = () => {
        router.push('/dashboard/properties');
    };

    const handleEditCycle = (cycle: RentCycleApiResponse) => {
        router.push(`/dashboard/rent-cycles/${cycle.id}`);
    };

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <RentCyclesWorkspace
            user={user}
            onNavigate={handleNavigate}
            onStartNew={handleStartNew}
            onEditCycle={handleEditCycle}
        />
    );
}
