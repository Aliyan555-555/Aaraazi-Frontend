"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
<<<<<<< Updated upstream
import { PurchaseCyclesWorkspaceV4 } from '@/components/purchase-cycles/PurchaseCyclesWorkspaceV4';
import { User, mapAuthUserToUIUser, PurchaseCycle } from '@/types';
=======
import { PurchaseCyclesWorkspace } from '@/components/purchase-cycles/PurchaseCyclesWorkspace';
import { GlobalLoadingScreen } from '@/components/ui/GlobalLoadingScreen';
import { mapAuthUserToUIUser } from '@/types';
import type { PurchaseCycle } from '@/types';
>>>>>>> Stashed changes

export default function PurchaseCyclesPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (section: string, id?: string) => {
        if (section === 'purchase-cycle-details' && id) {
            router.push(`/dashboard/purchase-cycles/${id}`);
            return;
        }
        if (id) {
            router.push(`/dashboard/${section}/${id}`);
        } else {
            router.push(`/dashboard/${section}`);
        }
    };

    const handleStartNew = () => {
        router.push('/dashboard/purchase-cycles/new');
    };

    const handleEditCycle = (cycle: PurchaseCycle) => {
        router.push(`/dashboard/purchase-cycles/${cycle.id}`);
    };

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!user) {
        return (
            <GlobalLoadingScreen
                message="Loading..."
                className="h-[calc(100vh-4rem)]"
                size="lg"
            />
        );
    }

    return (
        <PurchaseCyclesWorkspaceV4
            user={user}
            onNavigate={handleNavigate}
            onStartNew={handleStartNew}
            onEditCycle={handleEditCycle}
        />
    );
}
