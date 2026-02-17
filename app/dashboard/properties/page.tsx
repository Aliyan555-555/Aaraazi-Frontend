"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertiesWorkspace } from '@/components/properties/PropertiesWorkspace';
import { GlobalLoadingScreen } from '@/components/ui/GlobalLoadingScreen';
import { mapAuthUserToUIUser } from '@/types';
import type { User, Property } from '@/types';

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
            <GlobalLoadingScreen
                message="Loading..."
                className="h-[calc(100vh-4rem)]"
                size="lg"
            />
        );
    }

    return (
        <PropertiesWorkspace
            user={user}
            onNavigate={handleNavigate}
            onAddProperty={handleStartNew}
            onEditProperty={handleEditProperty}
        />

    );
}
