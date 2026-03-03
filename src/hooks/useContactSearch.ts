/**
 * useContactSearch - Zustand-based
 * Debounced contact search for forms
 */

'use client';

import { useEffect } from 'react';
import { useContactSearchStore } from '@/store/useContactSearchStore';

export function useContactSearch(query: string, limit = 10, agentId?: string) {
  const results = useContactSearchStore((s) => s.results);
  const isLoading = useContactSearchStore((s) => s.isLoading);

  useEffect(() => {
    useContactSearchStore.getState().search(query, limit, agentId);
  }, [query, limit, agentId]);

  const clear = useContactSearchStore.getState().clear;

  return {
    contacts: results,
    isLoading,
    clear,
  };
}
