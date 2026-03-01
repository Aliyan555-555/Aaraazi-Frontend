"use client";

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ContactDetailsV4 } from '@/components/contacts/ContactDetailsV4';
import { mapAuthUserToUIUser } from '@/types';
import { toast } from 'sonner';

export default function ContactDetailPage() {
  const { id } = useParams();
  const { user: saasUser } = useAuthStore();
  const router = useRouter();

  const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

  if (!id || typeof id !== 'string' || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-gray-500 mb-4">Contact not found</p>
        <button
          onClick={() => router.push('/dashboard/contacts')}
          className="text-primary hover:underline"
        >
          Back to Contacts
        </button>
      </div>
    );
  }

  const handleNavigate = (page: string, data?: unknown) => {
    if (page === 'contact-details' && typeof data === 'string') {
      router.push(`/dashboard/contacts/${data}`);
      return;
    }
    if (page === 'property-detail' && data && typeof data === 'object' && 'id' in data) {
      router.push(`/dashboard/properties/${(data as { id: string }).id}`);
      return;
    }
    if (page === 'contacts') {
      router.push('/dashboard/contacts');
      return;
    }
    router.push(`/dashboard/${page}`);
  };

  return (
    <ContactDetailsV4
      contactId={id}
      user={user}
      onBack={() => router.push('/dashboard/contacts')}
      onNavigate={handleNavigate}
      onEdit={(contact) => {
        // TODO: open edit modal or navigate to edit route when implemented
        toast.info(`Edit contact: ${contact.name}`);
      }}
      onDelete={(contactId) => toast.info(`Delete contact: ${contactId}`)}
    />
  );
}
