"use client";

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ContactDetails } from '@/components/contacts/ContactDetails';
import { mapAuthUserToUIUser } from '@/types';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactDetailPage() {
  const { id } = useParams();
  const { user: saasUser, isInitialized } = useAuthStore();
  const router = useRouter();

  const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

  // Invalid route - no contact id
  if (!id || typeof id !== 'string') {
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

  // Auth still rehydrating – show loading instead of "not found"
  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-pulse h-8 w-8 rounded-full bg-primary/20" />
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ContactDetails
      contactId={id}
      user={user}
      onBack={() => router.push('/dashboard/contacts')}
      onDelete={(contactId) => toast.info(`Delete contact: ${contactId}`)}
    />
  );
}
