/**
 * Offers Hooks
 * Mutations for creating, accepting, rejecting, and countering offers
 */

import { useState, useCallback } from 'react';
import { offersService } from '@/services/offers.service';
import type { CreateOfferPayload } from '@/services/offers.service';

export function useCreateOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOffer = useCallback(
    async (sellCycleId: string, payload: CreateOfferPayload) => {
      try {
        setIsLoading(true);
        setError(null);
        const offer = await offersService.create(sellCycleId, payload);
        return offer;
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to create offer';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { createOffer, isLoading, error };
}

export function useAcceptOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptOffer = useCallback(
    async (sellCycleId: string, offerId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await offersService.accept(sellCycleId, offerId);
        return result;
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to accept offer';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { acceptOffer, isLoading, error };
}

export function useRejectOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectOffer = useCallback(
    async (sellCycleId: string, offerId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const offer = await offersService.reject(sellCycleId, offerId);
        return offer;
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to reject offer';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { rejectOffer, isLoading, error };
}

export function useCounterOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counterOffer = useCallback(
    async (sellCycleId: string, offerId: string, counterAmount: number) => {
      try {
        setIsLoading(true);
        setError(null);
        const offer = await offersService.counter(
          sellCycleId,
          offerId,
          counterAmount,
        );
        return offer;
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to counter offer';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { counterOffer, isLoading, error };
}
