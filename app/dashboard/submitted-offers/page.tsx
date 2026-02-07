"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MySubmittedOffers from '@/components/sharing/MySubmittedOffers';
import { User, mapAuthUserToUIUser } from '@/types';

export default function SubmittedOffersPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (page: string, data?: any) => {
        // Implementation for navigation
        console.log(`Navigating to ${page}`, data);
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
        <MySubmittedOffers
            user={user}
            onViewProperty={(pid, cid, type) => {
                const route = type === 'sell' ? `/dashboard/sell-cycles/${cid}` : `/dashboard/rent-cycles/${cid}`;
                router.push(route);
            }}
        />
    );
}
