"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { DealDetails } from '@/components/DealDetails';
import { mapAuthUserToUIUser } from '@/types';

export default function DealDetailPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!id || typeof id !== 'string' || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 mb-4">Deal not found</p>
                <button
                    onClick={() => router.push('/dashboard/deals')}
                    className="text-primary hover:underline"
                >
                    Back to Deals
                </button>
            </div>
        );
    }

    const handleNavigate = (page: string, navigateId: string) => {
        router.push(`/dashboard/${page}/${navigateId}`);
    };

    return (
        <DealDetails
            dealId={id}
            user={user}
            onBack={() => router.push('/dashboard/deals')}
            onNavigate={handleNavigate}
        />
    );
}
