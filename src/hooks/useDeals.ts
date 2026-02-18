/**
 * Deals Hooks
 * useDeals() - list all deals
 * useDeal(id) - single deal by id
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { dealsService } from '@/services/deals.service';
import type { Deal } from '@/types/deals';

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dealsService.findAll();
      setDeals(data);
      return data;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load deals';
      setError(msg);
      setDeals([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { deals, isLoading, error, refetch };
}

export function useDeal(id: string | undefined, enabled = true) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id || typeof id !== 'string') return null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await dealsService.findOne(id);
      setDeal(data);
      return data;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load deal';
      setError(msg);
      setDeal(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && typeof id === 'string' && enabled) {
      refetch();
    } else {
      setDeal(null);
      setError(null);
      setIsLoading(false);
    }
  }, [id, enabled, refetch]);

  return { deal, isLoading, error, refetch };
}
