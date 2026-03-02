"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ContactsWorkspace } from '@/components/contacts/ContactsWorkspace';
import { User, mapAuthUserToUIUser } from '@/types';

export default function ContactsPage() {
    const { user: saasUser } = useAuthStore();
    const router = useRouter();

    const handleNavigate = (page: string, data?: string) => {
        console.log(`Navigating to ${page}`, data);

        if (page === 'contact-details' && data) {
            router.push(`/dashboard/contacts/${data}`);
            return;
        }

        const routeMap: Record<string, string> = {
            'dashboard': '/dashboard',
            'contacts': '/dashboard/contacts',
        };

        const route = routeMap[page] || `/dashboard/${page}`;
        router.push(route);
    };

    const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <ContactsWorkspace
            user={user}
            onNavigate={handleNavigate}
            onAddContact={() => console.log("Add contact clicked")}
            onEditContact={(contact) => console.log("Edit contact clicked", contact)}
        />
    );
}
