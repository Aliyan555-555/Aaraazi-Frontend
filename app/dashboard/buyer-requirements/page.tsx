"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { BuyerRequirementsWorkspace } from '@/components/requirements/BuyerRequirementsWorkspace';
import { User, mapAuthUserToUIUser } from '@/types';

export default function BuyerRequirementsPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (page: string, data?: any) => {
        console.log(`Navigating to ${page}`, data);
        const routeMap: Record<string, string> = {
            'dashboard': '/dashboard',
            'buyer-requirements': '/dashboard/buyer-requirements',
        };
        const route = routeMap[page] || `/dashboard/${page}`;
        router.push(route);
    };

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!user) {
        return (<div className="flex items-center justify-center h-[calc(100vh-4rem)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>);
    }

    return (
        <BuyerRequirementsWorkspace
            user={user}
            onNavigate={handleNavigate}
            onAddNew={() => console.log("Add new requirement")}
        />
    );
}
