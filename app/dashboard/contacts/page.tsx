"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ContactsWorkspace } from '@/components/contacts/ContactsWorkspace';
import { User, mapAuthUserToUIUser } from '@/types';

export default function ContactsPage() {
    const { user: saasUser } = useAuthStore();

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
            onAddContact={() => console.log("Add contact clicked")}
            onEditContact={(contact) => console.log("Edit contact clicked", contact)}
        />
    );
}
