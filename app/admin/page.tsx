'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin route redirects to dashboard.
 * SaaS admin module has been removed; all users use the main dashboard.
 */
export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);

    return null;
}
