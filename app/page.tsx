'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * Root Page - Professional Entry Point
 * Handles intelligent routing based on authentication state
 */
export default function Home() {
    const router = useRouter();
    const { isAuthenticated, isInitialized, user } = useAuth();

    useEffect(() => {
        if (!isInitialized) {
            // Wait for auth store to initialize
            return;
        }

        if (!isAuthenticated) {
            // Not logged in - redirect to agency code page
            router.replace('/auth/agency-code');
            return;
        }

        // User is authenticated - route based on role
        if (user?.role === 'SAAS_ADMIN') {
            router.replace('/admin');
        } else {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isInitialized, user, router]);

    // Show professional loading state while initializing
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
                    </div>
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
