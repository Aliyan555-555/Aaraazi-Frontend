"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { DealsWorkspaceV4 } from '@/components/deals/DealsWorkspaceV4';
import { User, mapAuthUserToUIUser } from '@/types';

export default function DealsPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (page: string, data?: any) => {
        if (page === 'deal-details' && data) {
            router.push(`/dashboard/deals/${data}`);
            return;
        }
        const routeMap: Record<string, string> = {
            dashboard: '/dashboard',
            deals: '/dashboard/deals',
        };
        const route = routeMap[page] ?? `/dashboard/${page}`;
        router.push(route);
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
        <DealsWorkspaceV4
            user={user}
            onNavigate={handleNavigate}
            onAddDeal={() => console.log("Add deal clicked")}
            onEditDeal={(deal) => console.log("Edit deal clicked", deal)}
        />
    );
}
