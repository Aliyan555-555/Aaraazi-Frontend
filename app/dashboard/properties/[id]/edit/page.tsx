"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertyForm } from '@/components/PropertyForm';
import { mapAuthUserToUIUser } from '@/types';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProperty } from '@/hooks/useProperties';

export default function EditPropertyPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const { property, isLoading, error } = useProperty(id as string | undefined);

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading property data...</p>
            </div>
        );
    }

    if (error || !property || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Could Not Load Property</h3>
                <p className="text-gray-600 mb-6 max-w-sm">{error || 'The property you are trying to edit was not found.'}</p>
                <Button onClick={() => router.push('/dashboard/properties')}>
                    Back to Properties
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <PropertyForm
                user={user}
                editingProperty={property}
                onBack={() => router.push(`/dashboard/properties/${id}`)}
                onSuccess={() => {
                    toast.success('Property updated successfully!');
                    router.push(`/dashboard/properties/${id}`);
                }}
            />
        </div>
    );
}
