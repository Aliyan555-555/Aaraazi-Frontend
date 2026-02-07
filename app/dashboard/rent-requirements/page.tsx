"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { RentRequirementsWorkspace } from '@/components/RentRequirementsWorkspace';
import { User, mapAuthUserToUIUser } from '@/types';

export default function RentRequirementsPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (page: string, data?: any) => {
        console.log(`Navigating to ${page}`, data);
        const routeMap: Record<string, string> = {
            'dashboard': '/dashboard',
            'rent-requirements': '/dashboard/rent-requirements',
        };
        const route = routeMap[page] || `/dashboard/${page}`;
        router.push(route);
    };

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    const handleViewDetails = (requirement: any) => {
        router.push(`/dashboard/rent-requirements/${requirement.id}`);
    };

    const handleAddNew = () => {
        sessionStorage.setItem('requirement_type', 'rent');
        router.push('/dashboard/rent-requirements/new');
    };

    if (!user) {
        return (<div className="flex items-center justify-center h-[calc(100vh-4rem)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>);
    }

    return (
        <RentRequirementsWorkspace
            user={user}
            onViewDetails={handleViewDetails}
            onAddNew={handleAddNew}
        />
    );
}

