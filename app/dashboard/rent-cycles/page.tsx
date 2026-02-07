"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { RentCyclesWorkspaceV4 } from '@/components/rent-cycles/RentCyclesWorkspaceV4';
import { User, mapAuthUserToUIUser, RentCycle } from '@/types';

export default function RentCyclesPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (section: string, id?: string) => {
        if (id) {
            router.push(`/dashboard/${section}/${id}`);
        } else {
            router.push(`/dashboard/${section}`);
        }
    };

    const handleStartNew = () => {
        console.log("Start new rent cycle");
    };

    const handleEditCycle = (cycle: RentCycle) => {
        router.push(`/dashboard/rent-cycles/${cycle.id}/edit`);
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
        <RentCyclesWorkspaceV4
            user={user}
            onNavigate={handleNavigate}
            onStartNew={handleStartNew}
            onEditCycle={handleEditCycle}
        />
    );
}
