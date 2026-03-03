'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

const INITIALIZATION_TIMEOUT_MS = 1500;

export default function Home() {
    const router = useRouter();
    const { isAuthenticated, isInitialized, user } = useAuth();
    const fallbackStarted = useRef(false);

    useEffect(() => {
        if (!isInitialized) {
            if (!fallbackStarted.current) {
                fallbackStarted.current = true;
                const t = setTimeout(() => {
                    useAuthStore.setState((s) => (s.isInitialized ? s : { ...s, isInitialized: true }));
                }, INITIALIZATION_TIMEOUT_MS);
                return () => clearTimeout(t);
            }
            return;
        }

        if (!isAuthenticated) {
            router.replace('/auth/agency-code');
            return;
        }

        if (user?.role === 'SAAS_ADMIN') {
            router.replace('/admin');
        } else {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isInitialized, user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="text-center space-y-6">
                <div className="relative flex items-center justify-center">
                    <Loader2 className="h-20 w-20 text-primary animate-spin relative z-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900">Aaraazi</h2>
                    <p className="text-sm text-gray-600">Loading your workspace...</p>
                </div>
            </div>
        </div>
    );
}
