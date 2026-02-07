"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { LeadDetailsV4 } from '@/components/leads/LeadDetailsV4';
import { mapAuthUserToUIUser } from '@/types';
import { toast } from 'sonner';

export default function LeadDetailPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!id || typeof id !== 'string' || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 mb-4">Lead not found</p>
                <button
                    onClick={() => router.push('/dashboard/leads')}
                    className="text-blue-600 hover:underline"
                >
                    Back to Leads
                </button>
            </div>
        );
    }

    const handleNavigate = (view: string, navigateId?: string) => {
        if (navigateId) {
            router.push(`/dashboard/${view}/${navigateId}`);
        } else {
            router.push(`/dashboard/${view}`);
        }
    };

    return (
        <LeadDetailsV4
            leadId={id}
            user={user}
            onBack={() => router.push('/dashboard/leads')}
            onNavigate={handleNavigate}
            onAddInteraction={(id) => toast.info('Add interaction logic')}
            onQualify={(id) => toast.info('Qualify logic')}
            onConvert={(id) => toast.info('Convert logic')}
            onMarkLost={(id) => toast.info('Mark lost logic')}
            onEdit={(id) => router.push(`/dashboard/leads/${id}/edit`)}
        />
    );
}
