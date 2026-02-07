"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { AgencyAnalyticsDashboard } from '@/components/AgencyAnalyticsDashboard';
import { User, mapAuthUserToUIUser } from '@/types';

export default function PerformancePage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleBack = () => {
        router.push('/dashboard');
    };

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!user) {
        return (<div className="flex items-center justify-center h-[calc(100vh-4rem)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>);
    }

    return (
        <AgencyAnalyticsDashboard
            user={user}
            onBack={handleBack}
        />
    );
}
