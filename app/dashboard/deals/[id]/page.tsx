"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { DealDetails } from '@/components/DealDetails';
import { mapAuthUserToUIUser } from '@/types';
import { useDeal } from '@/hooks/useDeals';
import { Button } from '@/components/ui/button';
import { GlobalLoadingScreen } from '@/components/ui/GlobalLoadingScreen';
import { AlertCircle } from 'lucide-react';

export default function DealDetailPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();
    const { deal, isLoading, error, refetch } = useDeal(id as string | undefined);
    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!id || typeof id !== 'string') {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 mb-4">Invalid deal</p>
                <Button variant="outline" onClick={() => router.push('/dashboard/deals')}>
                    Back to Deals
                </Button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <GlobalLoadingScreen
                message="Loading deal..."
                className="h-[calc(100vh-4rem)]"
                size="lg"
            />
        );
    }

    if (error || !deal) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Deal not found</h3>
                <p className="text-red-700 mb-6">{error ?? 'This deal may have been removed or you don’t have access.'}</p>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push('/dashboard/deals')}>
                        Back to Deals
                    </Button>
                    <Button onClick={() => refetch()}>Try again</Button>
                </div>
            </div>
        );
    }

    const handleNavigate = (page: string, navigateId: string) => {
        router.push(`/dashboard/${page}/${navigateId}`);
    };

    return (
        <DealDetails
            deal={deal}
            user={user}
            onBack={() => router.push('/dashboard/deals')}
            onUpdate={refetch}
            onNavigate={handleNavigate}
        />
    );
}
