/**
 * Sell Cycles Hooks
 * Encapsulates sell cycle operations - no API calls in components
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { sellCyclesService } from '@/services/sell-cycles.service';
import type { CreateSellCyclePayload } from '@/services/sell-cycles.service';

export function useCreateSellCycle() {
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback(async (data: CreateSellCyclePayload) => {
    setIsLoading(true);
    try {
      const startDate = data.startDate || new Date().toISOString().split('T')[0];
      return await sellCyclesService.create({
        ...data,
        startDate: data.startDate || startDate,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading };
}

export function useSellCycles(propertyListingId?: string) {
  const [cycles, setCycles] = useState<Awaited<ReturnType<typeof sellCyclesService.findAll>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sellCyclesService.findAll(propertyListingId);
      setCycles(data);
      return data;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to load sell cycles';
      setError(msg);
      setCycles([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [propertyListingId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data: { items: cycles }, cycles, isLoading, error, refetch };
}

/** Response shape from GET /sell-cycles/:id (single cycle) */
export type SellCycleApiSingle = Awaited<ReturnType<typeof sellCyclesService.findOne>>;

export function useSellCycle(id: string | undefined, enabled = true) {
  const [cycle, setCycle] = useState<SellCycleApiSingle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id || typeof id !== 'string') return null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await sellCyclesService.findOne(id);
      setCycle(data);
      return data;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load sell cycle';
      setError(msg);
      setCycle(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && typeof id === 'string' && enabled) {
      refetch();
    } else {
      setCycle(null);
      setError(null);
      setIsLoading(false);
    }
  }, [id, enabled, refetch]);

  return { cycle, isLoading, error, refetch };
}
