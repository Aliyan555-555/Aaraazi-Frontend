"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { SellCyclesWorkspace } from '@/components/sell-cycles/SellCyclesWorkspace';
import { User, mapAuthUserToUIUser, SellCycle } from '@/types';

export default function SellCyclesPage() {
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
        // TODO: Implement open modal or navigate to create page
        console.log("Start new sell cycle");
    };

    const handleEditCycle = (cycle: SellCycle) => {
        router.push(`/dashboard/sell-cycles/${cycle.id}/edit`);
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
        <SellCyclesWorkspace
            user={user}
            onNavigate={handleNavigate}
            onStartNew={handleStartNew}
            onEditCycle={handleEditCycle}
        />
    );
}
