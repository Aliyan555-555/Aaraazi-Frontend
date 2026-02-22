/**
 * Deals Hooks - Zustand-based
 * useDeals() - list all deals
 * useDeal(id) - single deal by id
 */

'use client';

import { useEffect } from 'react';
import { useDealsStore } from '@/store/useDealsStore';

const EMPTY_DEAL_DETAIL = { data: null, isLoading: true, error: null };
const EMPTY_DEAL_DETAIL_OFF = { data: null, isLoading: false, error: null };

export function useDeals() {
  const list = useDealsStore((s) => s.list);

  useEffect(() => {
    useDealsStore.getState().fetchList();
  }, []);

  return {
    deals: list.data,
    isLoading: list.isLoading,
    error: list.error,
    refetch: () => useDealsStore.getState().fetchList(),
  };
}

export function useDeal(id: string | undefined, enabled = true) {
  const entry = useDealsStore((s) => (id ? (s.details[id] ?? EMPTY_DEAL_DETAIL) : EMPTY_DEAL_DETAIL_OFF));

  useEffect(() => {
    if (enabled && id) {
      useDealsStore.getState().fetchDetail(id);
    }
  }, [id, enabled]);

  return {
    deal: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => (id ? useDealsStore.getState().fetchDetail(id) : Promise.resolve()),
  };
}
