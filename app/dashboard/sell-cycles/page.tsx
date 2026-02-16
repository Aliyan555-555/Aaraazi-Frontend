"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
<<<<<<< Updated upstream
import { SellCyclesWorkspaceV4 } from '@/components/sell-cycles/SellCyclesWorkspaceV4';
import { User, mapAuthUserToUIUser, SellCycle } from '@/types';
=======
import { SellCyclesWorkspace } from '@/components/sell-cycles/SellCyclesWorkspace';
import { mapAuthUserToUIUser } from '@/types';
import type { SellCycle } from '@/types';
>>>>>>> Stashed changes

export default function SellCyclesPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (section: string, id?: string) => {
        if (section === 'sell-cycle-details' && id) {
            router.push(`/dashboard/sell-cycles/${id}`);
            return;
        }
        if (id) {
            router.push(`/dashboard/${section}/${id}`);
        } else {
            router.push(`/dashboard/${section}`);
        }
    };

    const handleStartNew = () => {
        router.push('/dashboard/sell-cycles/new');
    };

    const handleEditCycle = (cycle: SellCycle) => {
        router.push(`/dashboard/sell-cycles/${cycle.id}`);
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
        <SellCyclesWorkspaceV4
            user={user}
            onNavigate={handleNavigate}
            onStartNew={handleStartNew}
            onEditCycle={handleEditCycle}
        />
    );
}
