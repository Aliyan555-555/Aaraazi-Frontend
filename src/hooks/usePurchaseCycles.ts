/**
 * Purchase Cycles Hooks
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { purchaseCyclesService } from '@/services/purchase-cycles.service';
import type {
  CreatePurchaseCyclePayload,
  CreatePurchaseCycleFromPropertyPayload,
} from '@/services/purchase-cycles.service';

export function useCreatePurchaseCycle() {
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback(async (data: CreatePurchaseCyclePayload) => {
    setIsLoading(true);
    try {
      return await purchaseCyclesService.create(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading };
}

export function useCreatePurchaseCycleFromProperty() {
  const [isLoading, setIsLoading] = useState(false);

  const createFromProperty = useCallback(
    async (data: CreatePurchaseCycleFromPropertyPayload) => {
      setIsLoading(true);
      try {
        return await purchaseCyclesService.createFromProperty(data);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createFromProperty, isLoading };
}

export function usePurchaseCycles(requirementId?: string) {
  const [cycles, setCycles] = useState<Awaited<ReturnType<typeof purchaseCyclesService.findAll>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await purchaseCyclesService.findAll(requirementId);
      setCycles(data);
      return data;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to load purchase cycles';
      setError(msg);
      setCycles([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [requirementId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data: { items: cycles }, cycles, isLoading, error, refetch };
}

export type PurchaseCycleApiSingle = Awaited<ReturnType<typeof purchaseCyclesService.findOne>>;

export function usePurchaseCycle(id: string | undefined, enabled = true) {
  const [cycle, setCycle] = useState<PurchaseCycleApiSingle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id || typeof id !== 'string') return null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await purchaseCyclesService.findOne(id);
      setCycle(data);
      return data;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to load purchase cycle';
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
