/**
 * Purchase Cycles Hooks - Zustand-based
 */

'use client';

import { useEffect } from 'react';
import { usePurchaseCyclesStore } from '@/store/usePurchaseCyclesStore';
import type { PurchaseCycleApiSingle } from '@/store/usePurchaseCyclesStore';

export type { PurchaseCycleApiSingle };

const EMPTY_PURCHASE_LIST = { data: [], isLoading: true, error: null };
const EMPTY_PURCHASE_DETAIL = { data: null, isLoading: true, error: null };
const EMPTY_PURCHASE_DETAIL_OFF = { data: null, isLoading: false, error: null };

function listKey(requirementId?: string): string {
  return requirementId ?? '__all__';
}

export function useCreatePurchaseCycle() {
  const createLoading = usePurchaseCyclesStore((s) => s.createLoading);
  return {
    create: usePurchaseCyclesStore.getState().create,
    isLoading: createLoading,
  };
}

export function useCreatePurchaseCycleFromProperty() {
  const createLoading = usePurchaseCyclesStore((s) => s.createLoading);
  return {
    createFromProperty: usePurchaseCyclesStore.getState().createFromProperty,
    isLoading: createLoading,
  };
}

export function usePurchaseCycles(requirementId?: string) {
  const key = listKey(requirementId);
  const entry = usePurchaseCyclesStore((s) => s.lists[key] ?? EMPTY_PURCHASE_LIST);

  useEffect(() => {
    usePurchaseCyclesStore.getState().fetchList(requirementId);
  }, [key]);

  return {
    data: { items: entry.data },
    cycles: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => usePurchaseCyclesStore.getState().fetchList(requirementId),
  };
}

export function usePurchaseCycle(id: string | undefined, enabled = true) {
  const entry = usePurchaseCyclesStore((s) => (id ? (s.details[id] ?? EMPTY_PURCHASE_DETAIL) : EMPTY_PURCHASE_DETAIL_OFF));

  useEffect(() => {
    if (enabled && id) {
      usePurchaseCyclesStore.getState().fetchDetail(id);
    }
  }, [id, enabled]);

  return {
    cycle: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => (id ? usePurchaseCyclesStore.getState().fetchDetail(id) : Promise.resolve()),
  };
}
