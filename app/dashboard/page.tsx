"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequireAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { mapAuthUserToUIUser } from '@/types';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const { user: authUser, currentModule, setCurrentModule, logout } = useAuthStore();
    const router = useRouter();
    const { isChecking } = useRequireAuth();

    const user = useMemo(() => mapAuthUserToUIUser(authUser), [authUser]);

    const handleNavigate = (page: string, _data?: unknown) => {
        const routeMap: Record<string, string> = {
            settings: '/dashboard/settings',
            properties: '/dashboard/properties',
            inventory: '/dashboard/properties',
            leads: '/dashboard/leads',
            tasks: '/dashboard/tasks',
            deals: '/dashboard/deals',
            'sell-cycles': '/dashboard/sell-cycles',
            'purchase-cycles': '/dashboard/purchase-cycles',
            'rent-cycles': '/dashboard/rent-cycles',
            financials: '/dashboard/financials',
            reports: '/dashboard/reports',
            documents: '/dashboard/documents',
        };
        router.push(routeMap[page] ?? `/dashboard/${page}`);
    };

    if (isChecking || !authUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!currentModule) {
        setCurrentModule('agency');
    }

    if (!user) return null;

    return (
        <Dashboard
            user={user}
            onNavigate={handleNavigate}
            currentModule="agency"
        />
    );
}
