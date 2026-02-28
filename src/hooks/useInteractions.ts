'use client';

/**
 * Interaction hooks powered by Zustand — replaces React Query
 */

import { useEffect } from 'react';
import { useInteractionsStore } from '@/stores/interactions.store';
import type {
  CreateInteractionDto,
  UpdateInteractionDto,
  QueryInteractionsDto,
} from '@/services/interactions.service';

function queryKey(query: QueryInteractionsDto): string {
  return JSON.stringify(query);
}

// ============================================================================
// Fetch Hooks
// ============================================================================

export function useInteractions(query: QueryInteractionsDto = {}) {
  const key = queryKey(query);
  const data = useInteractionsStore((s) => s.listCache[key]);
  const isLoading = useInteractionsStore((s) => s.listLoading[key] ?? false);
  const error = useInteractionsStore((s) => s.listError[key]);
  const fetchInteractions = useInteractionsStore((s) => s.fetchInteractions);

  useEffect(() => {
    void fetchInteractions(query);
  }, [key, fetchInteractions]);

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch: () => fetchInteractions(query),
  };
}

export function useContactInteractions(contactId: string) {
  return useInteractions({ contactId });
}

export function useInteraction(id: string) {
  const data = useInteractionsStore((s) => s.detailCache[id]);
  const isLoading = useInteractionsStore((s) => s.detailLoading[id] ?? false);
  const error = useInteractionsStore((s) => s.detailError[id]);
  const fetchInteraction = useInteractionsStore((s) => s.fetchInteraction);

  useEffect(() => {
    if (id) void fetchInteraction(id);
  }, [id, fetchInteraction]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchInteraction(id),
  };
}

export function useContactInteractionSummary(contactId: string) {
  const data = useInteractionsStore((s) => s.summaryCache[contactId]);
  const isLoading = useInteractionsStore((s) => s.summaryLoading[contactId] ?? false);
  const error = useInteractionsStore((s) => s.summaryError[contactId]);
  const fetchContactSummary = useInteractionsStore((s) => s.fetchContactSummary);

  useEffect(() => {
    if (contactId) void fetchContactSummary(contactId);
  }, [contactId, fetchContactSummary]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchContactSummary(contactId),
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateInteraction() {
  const createInteraction = useInteractionsStore((s) => s.createInteraction);
  const createLoading = useInteractionsStore((s) => s.createLoading);

  return {
    mutateAsync: createInteraction,
    isPending: createLoading,
  };
}

export function useUpdateInteraction() {
  const updateInteraction = useInteractionsStore((s) => s.updateInteraction);
  const updateLoading = useInteractionsStore((s) => s.updateLoading);

  return {
    mutateAsync: ({ id, data }: { id: string; data: UpdateInteractionDto }) =>
      updateInteraction(id, data),
    isPending: updateLoading,
  };
}

export function useDeleteInteraction() {
  const deleteInteraction = useInteractionsStore((s) => s.deleteInteraction);
  const deleteLoading = useInteractionsStore((s) => s.deleteLoading);

  return {
    mutateAsync: deleteInteraction,
    isPending: deleteLoading,
  };
}

// ============================================================================
// Keys (kept for compatibility)
// ============================================================================

export const interactionKeys = {
  all: ['interactions'] as const,
  lists: () => [...interactionKeys.all, 'list'] as const,
  list: (filters: QueryInteractionsDto) =>
    [...interactionKeys.lists(), filters] as const,
  details: () => [...interactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...interactionKeys.details(), id] as const,
  contactSummary: (contactId: string) =>
    [...interactionKeys.all, 'contact-summary', contactId] as const,
};
