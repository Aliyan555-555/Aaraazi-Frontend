/**
 * Offers Zustand Store
 * Mutation state for create, accept, reject
 */

'use client';

import { create } from 'zustand';
import { offersService } from '@/services/offers.service';
import type { CreateOfferPayload } from '@/services/offers.service';

export interface OffersStore {
  createLoading: boolean;
  createError: string | null;
  acceptLoading: boolean;
  acceptError: string | null;
  rejectLoading: boolean;
  rejectError: string | null;

  createOffer: (sellCycleId: string, payload: CreateOfferPayload) => Promise<Awaited<ReturnType<typeof offersService.create>>>;
  acceptOffer: (sellCycleId: string, offerId: string) => Promise<Awaited<ReturnType<typeof offersService.accept>>>;
  rejectOffer: (sellCycleId: string, offerId: string) => Promise<Awaited<ReturnType<typeof offersService.reject>>>;
}

export const useOffersStore = create<OffersStore>((set) => ({
  createLoading: false,
  createError: null,
  acceptLoading: false,
  acceptError: null,
  rejectLoading: false,
  rejectError: null,

  createOffer: async (sellCycleId, payload) => {
    set({ createLoading: true, createError: null });
    try {
      const result = await offersService.create(sellCycleId, payload);
      set({ createLoading: false });
      return result;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to create offer';
      set({ createLoading: false, createError: msg });
      throw err;
    }
  },

  acceptOffer: async (sellCycleId, offerId) => {
    set({ acceptLoading: true, acceptError: null });
    try {
      const result = await offersService.accept(sellCycleId, offerId);
      set({ acceptLoading: false });
      return result;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to accept offer';
      set({ acceptLoading: false, acceptError: msg });
      throw err;
    }
  },

  rejectOffer: async (sellCycleId, offerId) => {
    set({ rejectLoading: true, rejectError: null });
    try {
      const result = await offersService.reject(sellCycleId, offerId);
      set({ rejectLoading: false });
      return result;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to reject offer';
      set({ rejectLoading: false, rejectError: msg });
      throw err;
    }
  },
}));
