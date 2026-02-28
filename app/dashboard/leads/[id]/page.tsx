"use client";

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { LeadDetails } from '@/components/leads/LeadDetails';
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
        <LeadDetails
            leadId={id}
            user={user}
            onBack={() => router.push('/dashboard/leads')}
            onNavigate={handleNavigate}
            onAddInteraction={(id: string) => toast.info(`Add interaction logic for lead ${id}`)}
            onQualify={(id: string) => toast.info(`Qualify logic for lead ${id}`)}
            onConvert={(id: string) => toast.info(`Convert logic for lead ${id}`)}
            onMarkLost={(id: string) => toast.info(`Mark lost logic for lead ${id}`)}
            onEdit={(id: string) => router.push(`/dashboard/leads/${id}/edit`)}
        />
    );
}
