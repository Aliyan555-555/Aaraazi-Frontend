/**
 * Deals Zustand Store
 */

'use client';

import { create } from 'zustand';
import { dealsService } from '@/services/deals.service';
import type { Deal } from '@/types/deals';

export interface DealsStore {
  list: { data: Deal[]; isLoading: boolean; error: string | null };
  details: Record<string, { data: Deal | null; isLoading: boolean; error: string | null }>;

  fetchList: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
}

export const useDealsStore = create<DealsStore>((set, get) => ({
  list: { data: [], isLoading: true, error: null },
  details: {},

  fetchList: async () => {
    set((s) => ({ list: { ...s.list, isLoading: true, error: null } }));
    try {
      const data = await dealsService.findAll();
      set({ list: { data, isLoading: false, error: null } });
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load deals';
      set({ list: { data: [], isLoading: false, error: msg } });
    }
  },

  fetchDetail: async (id) => {
    set((s) => ({
      details: {
        ...s.details,
        [id]: { data: s.details[id]?.data ?? null, isLoading: true, error: null },
      },
    }));
    try {
      const data = await dealsService.findOne(id);
      set((s) => ({
        details: {
          ...s.details,
          [id]: { data, isLoading: false, error: null },
        },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load deal';
      set((s) => ({
        details: {
          ...s.details,
          [id]: { data: null, isLoading: false, error: msg },
        },
      }));
    }
  },
}));
