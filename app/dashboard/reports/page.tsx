"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import ReportsWorkspace from '@/components/reports/ReportsWorkspace';
import { User, UserRole } from '@/types';

export default function ReportsPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (page: string, data?: any) => {
        console.log(`Navigating to ${page}`, data);
        const routeMap: Record<string, string> = {
            'dashboard': '/dashboard',
            'reports': '/dashboard/reports',
        };
        const route = routeMap[page] || `/dashboard/${page}`;
        router.push(route);
    };

    if (!saasUser) {
        return (<div className="flex items-center justify-center h-[calc(100vh-4rem)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>);
    }

    return (
        <ReportsWorkspace
            onNavigate={handleNavigate}
        />
    );
}
