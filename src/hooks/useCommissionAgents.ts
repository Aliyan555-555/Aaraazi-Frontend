/**
 * Commission Agents Hooks
 * useInternalAgents – sync from auth store
 * useExternalBrokers – lazy fetch when modal opens
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { commissionService } from '@/services/commission.service';
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
  const [brokers, setBrokers] = useState<AgentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await commissionService.getExternalBrokers();
      setBrokers(data);
      return data;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load external brokers';
      setError(msg);
      setBrokers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      refetch();
    } else {
      setBrokers([]);
      setError(null);
    }
  }, [enabled, refetch]);

  return { brokers, isLoading, error, refetch };
}
