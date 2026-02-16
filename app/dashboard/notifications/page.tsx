"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationCenter } from '@/components/NotificationCenter';
import { mapAuthUserToUIUser } from '@/types';

export default function NotificationsPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const handleNavigate = (entityType: string, entityId: string) => {
        const routeMap: Record<string, string> = {
            'property': 'properties',
            'contact': 'contacts',
            'lead': 'leads',
            'deal': 'deals',
            'task': 'tasks',
            'sell-cycle': 'sell-cycles',
            'purchase-cycle': 'purchase-cycles',
            'rent-cycle': 'rent-cycles',
        };
        const section = routeMap[entityType] ?? entityType;
        router.push(`/dashboard/${section}/${entityId}`);
    };

    return (
        <NotificationCenter
            user={user}
            onNavigate={handleNavigate}
        />
    );
}
