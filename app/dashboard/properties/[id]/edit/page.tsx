"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { PropertyForm } from '@/components/PropertyForm';
// [STUBBED] import { getPropertyById } from '@/lib/data';
import { mapAuthUserToUIUser } from '@/types';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const getPropertyById = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


export default function EditPropertyPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const data = useMemo(() => {
        if (!id || typeof id !== 'string' || !saasUser) return null;

        const user = mapAuthUserToUIUser(saasUser);
        if (!user) return null;

        const property = getPropertyById(id);
        if (!property) return null;

        return { property, user };
    }, [id, saasUser]);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 mb-4">Property not found</p>
                <button
                    onClick={() => router.push('/dashboard/properties')}
                    className="text-blue-600 hover:underline"
                >
                    Back to Properties
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <PropertyForm
                user={data.user}
                editingProperty={data.property}
                onBack={() => router.push(`/dashboard/properties/${id}`)}
                onSuccess={() => {
                    toast.success('Property updated successfully!');
                    router.push(`/dashboard/properties/${id}`);
                }}
            />
        </div>
    );
}
