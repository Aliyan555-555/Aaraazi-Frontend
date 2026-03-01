'use client';

/**
 * Contact hooks powered by Zustand — replaces React Query
 */

import { useEffect } from 'react';
import { useContactsStore } from '@/stores/contacts.store';
import type {
  CreateContactDto,
  UpdateContactDto,
  QueryContactsDto,
} from '@/services/contacts.service';

function queryKey(query: QueryContactsDto): string {
  return JSON.stringify(query);
}

// ============================================================================
// Fetch Hooks
// ============================================================================

export function useContacts(query: QueryContactsDto = {}) {
  const key = queryKey(query);
  const data = useContactsStore((s) => s.listCache[key]);
  const isLoading = useContactsStore((s) => s.listLoading[key] ?? false);
  const error = useContactsStore((s) => s.listError[key]);
  const fetchContacts = useContactsStore((s) => s.fetchContacts);

  useEffect(() => {
    void fetchContacts(query);
  }, [key, fetchContacts]);

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 10,
    pages: data?.pages ?? 0,
    isLoading,
    error,
    refetch: () => fetchContacts(query),
  };
}

export function useContact(id: string, enabled = true) {
  const data = useContactsStore((s) => s.detailCache[id]);
  const isLoading = useContactsStore((s) => s.detailLoading[id] ?? false);
  const error = useContactsStore((s) => s.detailError[id]);
  const fetchContact = useContactsStore((s) => s.fetchContact);

  useEffect(() => {
    if (enabled && id) void fetchContact(id);
  }, [id, enabled, fetchContact]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchContact(id),
  };
}

export function useContactStatistics() {
  const data = useContactsStore((s) => s.statistics);
  const isLoading = useContactsStore((s) => s.statisticsLoading);
  const error = useContactsStore((s) => s.statisticsError);
  const fetchStatistics = useContactsStore((s) => s.fetchStatistics);

  useEffect(() => {
    void fetchStatistics();
  }, [fetchStatistics]);

  return {
    data: data ?? undefined,
    isLoading,
    error,
    refetch: fetchStatistics,
  };
}

// ============================================================================
// Mutation Hooks (return { mutateAsync, isPending })
// ============================================================================

export function useCreateContact() {
  const createContact = useContactsStore((s) => s.createContact);
  const createLoading = useContactsStore((s) => s.createLoading);

  return {
    mutateAsync: createContact,
    isPending: createLoading,
  };
}

export function useUpdateContact() {
  const updateContact = useContactsStore((s) => s.updateContact);
  const updateLoading = useContactsStore((s) => s.updateLoading);

  return {
    mutateAsync: ({ id, data }: { id: string; data: UpdateContactDto }) =>
      updateContact(id, data),
    isPending: updateLoading,
  };
}

export function useDeleteContact() {
  const deleteContact = useContactsStore((s) => s.deleteContact);
  const deleteLoading = useContactsStore((s) => s.deleteLoading);

  return {
    mutateAsync: deleteContact,
    isPending: deleteLoading,
  };
}

export function useBulkUpdateContacts() {
  const bulkUpdate = useContactsStore((s) => s.bulkUpdate);

  return {
    mutateAsync: ({ ids, updates }: { ids: string[]; updates: UpdateContactDto }) =>
      bulkUpdate(ids, updates),
    isPending: false,
  };
}

export function useBulkDeleteContacts() {
  const bulkDelete = useContactsStore((s) => s.bulkDelete);

  return {
    mutateAsync: bulkDelete,
    isPending: false,
  };
}

// ============================================================================
// Utility (kept for compatibility)
// ============================================================================

export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (filters: QueryContactsDto) => [...contactsKeys.lists(), filters] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
  statistics: () => [...contactsKeys.all, 'statistics'] as const,
};

export function usePrefetchContact() {
  const fetchContact = useContactsStore((s) => s.fetchContact);
  return (id: string) => fetchContact(id);
}

export function useInvalidateContacts() {
  return useContactsStore((s) => s.invalidateLists);
}
