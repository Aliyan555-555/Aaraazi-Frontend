/**
 * Offers Hooks - Zustand-based
 * Mutations for creating, accepting, and rejecting offers
 */

'use client';

import { useOffersStore } from '@/store/useOffersStore';
import type { CreateOfferPayload } from '@/services/offers.service';

export function useCreateOffer() {
  const createLoading = useOffersStore((s) => s.createLoading);
  const createError = useOffersStore((s) => s.createError);
  return {
    createOffer: useOffersStore.getState().createOffer,
    isLoading: createLoading,
    error: createError,
  };
}

export function useAcceptOffer() {
  const acceptLoading = useOffersStore((s) => s.acceptLoading);
  const acceptError = useOffersStore((s) => s.acceptError);
  return {
    acceptOffer: useOffersStore.getState().acceptOffer,
    isLoading: acceptLoading,
    error: acceptError,
  };
}

export function useRejectOffer() {
  const rejectLoading = useOffersStore((s) => s.rejectLoading);
  const rejectError = useOffersStore((s) => s.rejectError);
  return {
    rejectOffer: useOffersStore.getState().rejectOffer,
    isLoading: rejectLoading,
    error: rejectError,
  };
}
