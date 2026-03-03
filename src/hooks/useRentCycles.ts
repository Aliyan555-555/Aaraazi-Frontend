/**
 * Rent Cycles Hooks - Zustand-based
 */

'use client';

import { useEffect } from 'react';
import { useRentCyclesStore } from '@/store/useRentCyclesStore';
import type { RentCycleApiSingle, RentCycleApiList } from '@/store/useRentCyclesStore';

export type { RentCycleApiSingle, RentCycleApiList };

const EMPTY_RENT_LIST = { data: [], isLoading: true, error: null };
const EMPTY_RENT_DETAIL = { data: null, isLoading: true, error: null };
const EMPTY_RENT_DETAIL_OFF = { data: null, isLoading: false, error: null };

function listKey(propertyListingId?: string): string {
  return propertyListingId ?? '__all__';
}

export function useRentCycles(propertyListingId?: string) {
  const key = listKey(propertyListingId);
  const entry = useRentCyclesStore((s) => s.lists[key] ?? EMPTY_RENT_LIST);

  useEffect(() => {
    useRentCyclesStore.getState().fetchList(propertyListingId);
  }, [key]);

  return {
    cycles: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => useRentCyclesStore.getState().fetchList(propertyListingId),
  };
}

export function useRentCycle(id: string | undefined, enabled = true) {
  const entry = useRentCyclesStore((s) => (id ? (s.details[id] ?? EMPTY_RENT_DETAIL) : EMPTY_RENT_DETAIL_OFF));

  useEffect(() => {
    if (enabled && id) {
      useRentCyclesStore.getState().fetchDetail(id);
    }
  }, [id, enabled]);

  return {
    cycle: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => (id ? useRentCyclesStore.getState().fetchDetail(id) : Promise.resolve()),
  };
}

export function useCreateRentCycle() {
  const mutateLoading = useRentCyclesStore((s) => s.mutateLoading);
  return {
    create: useRentCyclesStore.getState().create,
    isLoading: mutateLoading,
  };
}

export function useUpdateRentCycle() {
  const mutateLoading = useRentCyclesStore((s) => s.mutateLoading);
  return {
    update: useRentCyclesStore.getState().update,
    isLoading: mutateLoading,
  };
}
