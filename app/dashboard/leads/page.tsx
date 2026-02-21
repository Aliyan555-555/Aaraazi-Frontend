"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import LeadWorkspace from '@/components/leads/LeadWorkspace';
import { User, mapAuthUserToUIUser } from '@/types';

export default function LeadsPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (page: string, data?: any) => {
        console.log(`Navigating to ${page}`, data);
        const routeMap: Record<string, string> = {
            'dashboard': '/dashboard',
            'leads': '/dashboard/leads',
            'lead-details': `/dashboard/leads/${data}`,
            'contact-details': `/dashboard/contacts/${data}`,
            'buyer-requirements': `/dashboard/buyer-requirements/${data}`,
        };

        if (page === 'lead-details' && data) {
            router.push(`/dashboard/leads/${data}`);
            return;
        }

        const route = routeMap[page] || `/dashboard/${page}`;
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
        <LeadWorkspace
            user={user}
            onNavigate={handleNavigate}
            onCreateLead={() => console.log("Create lead clicked")}
        />
    );
}
