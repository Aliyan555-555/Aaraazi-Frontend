/**
 * Contacts Hooks - Zustand-based
 * Thin wrappers over useContactsStore
 */

'use client';

import { useEffect } from 'react';
import { useContactsStore } from '@/store/useContactsStore';
import type {
  CreateContactDto,
  UpdateContactDto,
  QueryContactsDto,
} from '@/services/contacts.service';

// ============================================================================
// Query key helper (exported for consumers that need cache keys)
// ============================================================================

function queryKey(query: QueryContactsDto): string {
  const sorted = Object.keys(query)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: (query as Record<string, unknown>)[k] }), {});
  return JSON.stringify(sorted);
}

const EMPTY_CONTACTS_ENTRY = {
  data: [] as unknown[],
  pagination: { total: 0, page: 1, limit: 10, pages: 0 },
  isLoading: true,
  error: null as string | null,
};
const EMPTY_CONTACT_DETAIL = { data: null as unknown, isLoading: true, error: null as string | null };
const EMPTY_CONTACT_DETAIL_DISABLED = { data: null, isLoading: false, error: null };

// ============================================================================
// Fetch Hooks
// ============================================================================

/**
 * Fetch all contacts with pagination and filters
 */
export function useContacts(query: QueryContactsDto = {}) {
  const key = queryKey(query);
  const entry = useContactsStore((s) => s.lists[key] ?? EMPTY_CONTACTS_ENTRY);

  useEffect(() => {
    useContactsStore.getState().fetchList(query);
  }, [key]);

  return {
    data: { data: entry.data, ...entry.pagination },
    contacts: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => useContactsStore.getState().fetchList(query),
  };
}

/**
 * Fetch a single contact by ID
 */
export function useContact(id: string, enabled = true) {
  const entry = useContactsStore((s) =>
    id ? (s.details[id] ?? EMPTY_CONTACT_DETAIL) : EMPTY_CONTACT_DETAIL_DISABLED
  );

  useEffect(() => {
    if (enabled && id) {
      useContactsStore.getState().fetchDetail(id);
    }
  }, [id, enabled]);

  return {
    contact: entry.data,
    data: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => (id ? useContactsStore.getState().fetchDetail(id) : Promise.resolve()),
  };
}

/**
 * Fetch contact statistics
 */
export function useContactStatistics() {
  const statistics = useContactsStore((s) => s.statistics);

  useEffect(() => {
    useContactsStore.getState().fetchStatistics();
  }, []);

  return {
    data: statistics.data,
    isLoading: statistics.isLoading,
    error: statistics.error,
    refetch: () => useContactsStore.getState().fetchStatistics(),
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new contact
 */
export function useCreateContact() {
  const create = useContactsStore((s) => s.create);
  const mutateLoading = useContactsStore((s) => s.mutateLoading);
  const mutateError = useContactsStore((s) => s.mutateError);

  return {
    mutateAsync: create,
    mutate: (data: CreateContactDto) => create(data),
    isLoading: mutateLoading,
    error: mutateError,
  };
}

/**
 * Update an existing contact
 */
export function useUpdateContact() {
  const update = useContactsStore((s) => s.update);
  const mutateLoading = useContactsStore((s) => s.mutateLoading);
  const mutateError = useContactsStore((s) => s.mutateError);

  return {
    mutateAsync: ({ id, data }: { id: string; data: UpdateContactDto }) => update(id, data),
    mutate: ({ id, data }: { id: string; data: UpdateContactDto }) => update(id, data),
    isLoading: mutateLoading,
    error: mutateError,
  };
}

/**
 * Delete a contact
 */
export function useDeleteContact() {
  const remove = useContactsStore((s) => s.remove);
  const mutateLoading = useContactsStore((s) => s.mutateLoading);
  const mutateError = useContactsStore((s) => s.mutateError);

  return {
    mutateAsync: remove,
    mutate: remove,
    isLoading: mutateLoading,
    error: mutateError,
  };
}

/**
 * Bulk update contacts
 */
export function useBulkUpdateContacts() {
  const bulkUpdate = useContactsStore((s) => s.bulkUpdate);
  const mutateLoading = useContactsStore((s) => s.mutateLoading);
  const mutateError = useContactsStore((s) => s.mutateError);

  return {
    mutateAsync: ({ ids, updates }: { ids: string[]; updates: UpdateContactDto }) =>
      bulkUpdate(ids, updates),
    mutate: ({ ids, updates }: { ids: string[]; updates: UpdateContactDto }) =>
      bulkUpdate(ids, updates),
    isLoading: mutateLoading,
    error: mutateError,
  };
}

/**
 * Bulk delete contacts
 */
export function useBulkDeleteContacts() {
  const bulkDelete = useContactsStore((s) => s.bulkDelete);
  const mutateLoading = useContactsStore((s) => s.mutateLoading);
  const mutateError = useContactsStore((s) => s.mutateError);

  return {
    mutateAsync: bulkDelete,
    mutate: bulkDelete,
    isLoading: mutateLoading,
    error: mutateError,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch contact details
 */
export function usePrefetchContact() {
  const prefetchDetail = useContactsStore((s) => s.prefetchDetail);
  return (id: string) => prefetchDetail(id);
}

/**
 * Invalidate all contact queries
 */
export function useInvalidateContacts() {
  const invalidateAll = useContactsStore((s) => s.invalidateAll);
  return () => invalidateAll();
}
