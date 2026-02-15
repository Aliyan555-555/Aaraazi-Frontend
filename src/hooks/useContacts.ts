/**
 * Professional Contacts Hooks with Zustand
 * Convenient hooks for contact operations with proper error handling
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useContactsStore } from '@/store/useContactsStore';
import type {
  CreateContactDto,
  UpdateContactDto,
  QueryContactsDto,
} from '@/services/contacts.service';
import { toast } from 'sonner';

// ============================================================================
// useContacts Hook - Main hook for contact operations
// ============================================================================

export function useContacts(query?: QueryContactsDto) {
  const {
    contacts,
    total,
    page,
    limit,
    pages,
    isLoading,
    isInitialized,
    error,
    filters,
    fetchContacts,
    setFilters,
    clearFilters,
    clearError,
  } = useContactsStore();

  // Auto-fetch on mount or when query changes
  useEffect(() => {
    if (query) {
      setFilters(query);
    }
    fetchContacts(query);
  }, [
    query?.type,
    query?.category,
    query?.status,
    query?.agentId,
    query?.search,
    query?.page,
    query?.limit,
  ]);

  const refetch = useCallback(() => {
    fetchContacts(query);
  }, [fetchContacts, query]);

  return {
    contacts,
    data: contacts, // Alias for compatibility
    total,
    page,
    limit,
    pages,
    isLoading,
    isInitialized,
    error,
    filters,
    refetch,
    setFilters,
    clearFilters,
    clearError,
  };
}

// ============================================================================
// useContact Hook - Single contact
// ============================================================================

export function useContact(id: string, enabled: boolean = true) {
  const { currentContact, isLoading, error, fetchContact, clearError } =
    useContactsStore();

  useEffect(() => {
    if (id && enabled) {
      fetchContact(id);
    }
  }, [id, enabled]);

  return {
    contact: currentContact,
    data: currentContact, // Alias for compatibility
    isLoading,
    error,
    refetch: () => fetchContact(id),
    clearError,
  };
}

// ============================================================================
// useContactStatistics Hook
// ============================================================================

export function useContactStatistics() {
  const { statistics, fetchStatistics } = useContactsStore();

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    data: statistics, // Alias for compatibility
    refetch: fetchStatistics,
  };
}

// ============================================================================
// useCreateContact Hook
// ============================================================================

export function useCreateContact() {
  const { createContact, isLoading, error } = useContactsStore();

  const create = useCallback(
    async (data: CreateContactDto) => {
      try {
        const contact = await createContact(data);
        toast.success('Contact created successfully');
        return contact;
      } catch (err) {
        console.error('Failed to create contact:', err);
        toast.error('Failed to create contact');
        throw err;
      }
    },
    [createContact]
  );

  return {
    mutate: create,
    mutateAsync: create,
    isLoading,
    isPending: isLoading, // Alias for React Query compatibility
    error,
  };
}

// ============================================================================
// useUpdateContact Hook
// ============================================================================

export function useUpdateContact() {
  const { updateContact, isLoading, error } = useContactsStore();

  const update = useCallback(
    async ({ id, data }: { id: string; data: UpdateContactDto }) => {
      try {
        const contact = await updateContact(id, data);
        toast.success('Contact updated successfully');
        return contact;
      } catch (err) {
        console.error('Failed to update contact:', err);
        toast.error('Failed to update contact');
        throw err;
      }
    },
    [updateContact]
  );

  return {
    mutate: update,
    mutateAsync: update,
    isLoading,
    isPending: isLoading, // Alias for React Query compatibility
    error,
  };
}

// ============================================================================
// useDeleteContact Hook
// ============================================================================

export function useDeleteContact() {
  const { deleteContact, isLoading, error } = useContactsStore();

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteContact(id);
        toast.success('Contact deleted successfully');
      } catch (err) {
        console.error('Failed to delete contact:', err);
        toast.error('Failed to delete contact');
        throw err;
      }
    },
    [deleteContact]
  );

  return {
    mutate: remove,
    mutateAsync: remove,
    isLoading,
    isPending: isLoading, // Alias for React Query compatibility
    error,
  };
}

// ============================================================================
// useBulkUpdateContacts Hook
// ============================================================================

export function useBulkUpdateContacts() {
  const { bulkUpdateContacts, isLoading, error } = useContactsStore();

  const bulkUpdate = useCallback(
    async ({ ids, updates }: { ids: string[]; updates: UpdateContactDto }) => {
      try {
        await bulkUpdateContacts(ids, updates);
        toast.success('Contacts updated successfully');
      } catch (err) {
        console.error('Failed to bulk update contacts:', err);
        toast.error('Failed to update contacts');
        throw err;
      }
    },
    [bulkUpdateContacts]
  );

  return {
    mutate: bulkUpdate,
    mutateAsync: bulkUpdate,
    isLoading,
    isPending: isLoading, // Alias for React Query compatibility
    error,
  };
}

// ============================================================================
// useBulkDeleteContacts Hook
// ============================================================================

export function useBulkDeleteContacts() {
  const { bulkDeleteContacts, isLoading, error } = useContactsStore();

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      try {
        await bulkDeleteContacts(ids);
        toast.success('Contacts deleted successfully');
      } catch (err) {
        console.error('Failed to bulk delete contacts:', err);
        toast.error('Failed to delete contacts');
        throw err;
      }
    },
    [bulkDeleteContacts]
  );

  return {
    mutate: bulkDelete,
    mutateAsync: bulkDelete,
    isLoading,
    isPending: isLoading, // Alias for React Query compatibility
    error,
  };
}
