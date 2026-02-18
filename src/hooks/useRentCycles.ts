/**
 * Rent Cycles Hooks
 * All rent cycle API access should go through these hooks.
 * No direct apiClient calls in components.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { rentCyclesService } from '@/services/rent-cycles.service';
import type { CreateRentCyclePayload, UpdateRentCyclePayload } from '@/services/rent-cycles.service';

// ─────────────────────────────────────────────────────────────
// Derived types
// ─────────────────────────────────────────────────────────────

export type RentCycleApiSingle = Awaited<ReturnType<typeof rentCyclesService.findOne>>;
export type RentCycleApiList = Awaited<ReturnType<typeof rentCyclesService.findAll>>;

// ─────────────────────────────────────────────────────────────
// List hook
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all rent cycles for the current agency.
 * Optionally filter by a specific property listing.
 */
export function useRentCycles(propertyListingId?: string) {
  const [cycles, setCycles] = useState<RentCycleApiList>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await rentCyclesService.findAll(propertyListingId);
      setCycles(data);
      return data;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load rent cycles';
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

  return { cycles, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────
// Single-item hook
// ─────────────────────────────────────────────────────────────

/**
 * Fetch a single rent cycle by ID.
 * Pass `enabled = false` to skip the initial fetch.
 */
export function useRentCycle(id: string | undefined, enabled = true) {
  const [cycle, setCycle] = useState<RentCycleApiSingle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id || typeof id !== 'string') return null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await rentCyclesService.findOne(id);
      setCycle(data);
      return data;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load rent cycle';
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

// ─────────────────────────────────────────────────────────────
// Create mutation hook
// ─────────────────────────────────────────────────────────────

/**
 * Create a rent cycle. Returns `{ create, isLoading }`.
 * Shows a toast on success/error when used with the `toast` parameter.
 */
export function useCreateRentCycle() {
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback(async (data: CreateRentCyclePayload) => {
    setIsLoading(true);
    try {
      return await rentCyclesService.create(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading };
}

// ─────────────────────────────────────────────────────────────
// Update mutation hook
// ─────────────────────────────────────────────────────────────

/**
 * Update a rent cycle's status or mutable fields.
 */
export function useUpdateRentCycle() {
  const [isLoading, setIsLoading] = useState(false);

  const update = useCallback(async (id: string, data: UpdateRentCyclePayload) => {
    setIsLoading(true);
    try {
      return await rentCyclesService.update(id, data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading };
}
