"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertiesWorkspaceV4 } from '@/components/properties/PropertiesWorkspaceV4';
import { User, mapAuthUserToUIUser, Property } from '@/types';

export default function PropertiesPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (section: string, id?: string) => {
        if (id) {
            router.push(`/dashboard/${section}/${id}`);
        } else {
            router.push(`/dashboard/${section}`);
        }
    };

    const handleStartNew = () => {
        router.push('/dashboard/properties/new');
    };


    const handleEditProperty = (property: Property) => {
        router.push(`/dashboard/properties/${property.id}/edit`);
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
        <PropertiesWorkspaceV4
            user={user}
            onNavigate={handleNavigate}
            onAddProperty={handleStartNew}
            onEditProperty={handleEditProperty}
        />

    );
}
