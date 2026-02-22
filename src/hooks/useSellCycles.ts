/**
 * Sell Cycles Hooks - Zustand-based
 */

'use client';

import { useEffect } from 'react';
import { useSellCyclesStore } from '@/store/useSellCyclesStore';
import type { SellCycleApiSingle } from '@/store/useSellCyclesStore';

export type { SellCycleApiSingle };

const EMPTY_SELL_LIST = { data: [], isLoading: true, error: null };
const EMPTY_SELL_DETAIL = { data: null, isLoading: true, error: null };
const EMPTY_SELL_DETAIL_OFF = { data: null, isLoading: false, error: null };

export function useCreateSellCycle() {
  const createLoading = useSellCyclesStore((s) => s.createLoading);
  return {
    create: useSellCyclesStore.getState().create,
    isLoading: createLoading,
  };
}

function listKey(propertyListingId?: string): string {
  return propertyListingId ?? '__all__';
}

export function useSellCycles(propertyListingId?: string) {
  const key = listKey(propertyListingId);
  const entry = useSellCyclesStore((s) => s.lists[key] ?? EMPTY_SELL_LIST);

  useEffect(() => {
    useSellCyclesStore.getState().fetchList(propertyListingId);
  }, [key]);

  return {
    data: { items: entry.data },
    cycles: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => useSellCyclesStore.getState().fetchList(propertyListingId),
  };
}

export function useSellCycle(id: string | undefined, enabled = true) {
  const entry = useSellCyclesStore((s) => (id ? (s.details[id] ?? EMPTY_SELL_DETAIL) : EMPTY_SELL_DETAIL_OFF));

  useEffect(() => {
    if (enabled && id) {
      useSellCyclesStore.getState().fetchDetail(id);
    }
  }, [id, enabled]);

  return {
    cycle: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => (id ? useSellCyclesStore.getState().fetchDetail(id) : Promise.resolve()),
  };
}
