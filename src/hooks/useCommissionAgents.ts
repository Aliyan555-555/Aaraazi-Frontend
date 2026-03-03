/**
 * Commission Agents Hooks - Zustand-based
 * useInternalAgents – sync from auth store
 * useExternalBrokers – Zustand store
 */

'use client';

import { useEffect } from 'react';
import { commissionService } from '@/services/commission.service';
import { useCommissionAgentsStore } from '@/store/useCommissionAgentsStore';
import type { AgentOption } from '@/services/commission.service';

/**
 * Internal agents from auth store. Sync, no loading state.
 */
export function useInternalAgents(): AgentOption[] {
  return commissionService.getInternalAgents();
}

/**
 * External brokers from contacts API. Fetches when enabled (e.g. modal open).
 */
export function useExternalBrokers(enabled: boolean) {
  const brokers = useCommissionAgentsStore((s) => s.brokers);
  const isLoading = useCommissionAgentsStore((s) => s.isLoading);
  const error = useCommissionAgentsStore((s) => s.error);

  useEffect(() => {
    if (enabled) {
      useCommissionAgentsStore.getState().fetchBrokers();
    } else {
      useCommissionAgentsStore.getState().clear();
    }
  }, [enabled]);

  return {
    brokers,
    isLoading,
    error,
    refetch: () => useCommissionAgentsStore.getState().fetchBrokers(),
  };
}
