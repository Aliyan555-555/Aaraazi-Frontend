"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { mapAuthUserToUIUser } from '@/types';

export default function PurchaseCycleDetailPage() {
    const { id } = useParams();
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!id || typeof id !== 'string' || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 mb-4">Purchase cycle not found</p>
                <button
                    onClick={() => router.push('/dashboard/purchase-cycles')}
                    className="text-primary hover:underline"
                >
                    Back to Purchase Cycles
                </button>
            </div>
        );
    }

    // TODO: Replace with actual API call when backend cycles are implemented
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center max-w-md text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Purchase Cycle Details</h3>
                <p className="text-blue-700 mb-2">
                    Cycle ID: <code className="bg-blue-100 px-2 py-0.5 rounded text-sm">{id}</code>
                </p>
                <p className="text-blue-600 text-sm mb-6">
                    Cycle detail views will be fully functional once the backend API for purchase cycles is implemented.
                </p>
                <button
                    onClick={() => router.push('/dashboard/purchase-cycles')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Purchase Cycles
                </button>
            </div>
        </div>
    );
}
