/**
 * Properties Hooks - Zustand-based
 * Thin wrappers over usePropertiesStore
 */

'use client';

import { useEffect } from 'react';
import { usePropertiesStore } from '@/store/usePropertiesStore';
import type { Property } from '@/types/properties';
import type { PropertyQueryParams } from '@/services/properties.service';

// ============================================================================
// Helpers
// ============================================================================

const EMPTY_PROP_LIST = { data: [], pagination: { page: 1, limit: 1000, total: 0, totalPages: 0 }, isLoading: true, error: null };
const EMPTY_PROP_DETAIL = { data: null, isLoading: true, error: null };
const EMPTY_PROP_DETAIL_OFF = { data: null, isLoading: false, error: null };
const EMPTY_PROP_WITH_CYCLES = {
  property: null,
  sellCycles: [],
  purchaseCycles: [],
  rentCycles: [],
  isLoading: true,
  error: null,
};
const EMPTY_PROP_WITH_CYCLES_OFF = {
  property: null,
  sellCycles: [],
  purchaseCycles: [],
  rentCycles: [],
  isLoading: false,
  error: null,
};

function paramsKey(params?: PropertyQueryParams): string {
  if (!params) return '{}';
  const p = { page: 1, limit: 1000, ...params };
  const sorted = Object.keys(p)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: (p as Record<string, unknown>)[k] }), {});
  return JSON.stringify(sorted);
}

// ============================================================================
// useProperties - List properties with pagination
// ============================================================================

export function useProperties(params?: PropertyQueryParams) {
  const key = paramsKey(params);
  const entry = usePropertiesStore((s) => s.lists[key] ?? EMPTY_PROP_LIST);

  useEffect(() => {
    usePropertiesStore.getState().fetchList(params);
  }, [key]);

  return {
    properties: entry.data,
    pagination: entry.pagination,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => usePropertiesStore.getState().fetchList(params),
  };
}

// ============================================================================
// useProperty - Single property by ID
// ============================================================================

export function useProperty(id: string | undefined, enabled = true) {
  const entry = usePropertiesStore((s) => (id ? (s.details[id] ?? EMPTY_PROP_DETAIL) : EMPTY_PROP_DETAIL_OFF));

  useEffect(() => {
    if (enabled && id) {
      usePropertiesStore.getState().fetchDetail(id);
    }
  }, [id, enabled]);

  return {
    property: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => (id ? usePropertiesStore.getState().fetchDetail(id) : Promise.resolve()),
  };
}

// ============================================================================
// usePropertyWithCycles - Single property + all cycles in one API call
// ============================================================================

export function usePropertyWithCycles(id: string | undefined, enabled = true) {
  const entry = usePropertiesStore((s) =>
    id ? (s.withCycles[id] ?? EMPTY_PROP_WITH_CYCLES) : EMPTY_PROP_WITH_CYCLES_OFF
  );

  useEffect(() => {
    if (enabled && id) {
      usePropertiesStore.getState().fetchWithCycles(id);
    }
  }, [id, enabled]);

  return {
    property: entry.property,
    sellCycles: entry.sellCycles,
    purchaseCycles: entry.purchaseCycles,
    rentCycles: entry.rentCycles,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => (id ? usePropertiesStore.getState().fetchWithCycles(id) : Promise.resolve()),
  };
}

// ============================================================================
// usePropertyMutations - Create, update, delete, upload
// ============================================================================

export function usePropertyMutations() {
  const mutateLoading = usePropertiesStore((s) => s.mutateLoading);
  return {
    create: usePropertiesStore.getState().create,
    update: usePropertiesStore.getState().update,
    remove: usePropertiesStore.getState().remove,
    uploadImage: usePropertiesStore.getState().uploadImage,
    isLoading: mutateLoading,
  };
}
