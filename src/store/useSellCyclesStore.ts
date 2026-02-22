/**
 * Sell Cycles Zustand Store
 */

'use client';

import { create } from 'zustand';
import { sellCyclesService } from '@/services/sell-cycles.service';
import type { CreateSellCyclePayload } from '@/services/sell-cycles.service';

export type SellCycleApiSingle = Awaited<ReturnType<typeof sellCyclesService.findOne>>;
export type SellCycleApiList = Awaited<ReturnType<typeof sellCyclesService.findAll>>;

export interface SellCyclesStore {
  lists: Record<string, { data: SellCycleApiList; isLoading: boolean; error: string | null }>;
  details: Record<string, { data: SellCycleApiSingle | null; isLoading: boolean; error: string | null }>;
  createLoading: boolean;

  fetchList: (propertyListingId?: string) => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  create: (data: CreateSellCyclePayload) => Promise<Awaited<ReturnType<typeof sellCyclesService.create>>>;
}

function listKey(propertyListingId?: string): string {
  return propertyListingId ?? '__all__';
}

export const useSellCyclesStore = create<SellCyclesStore>((set, get) => ({
  lists: {},
  details: {},
  createLoading: false,

  fetchList: async (propertyListingId) => {
    const key = listKey(propertyListingId);
    set((s) => ({
      lists: {
        ...s.lists,
        [key]: { data: s.lists[key]?.data ?? [], isLoading: true, error: null },
      },
    }));
    try {
      const data = await sellCyclesService.findAll(propertyListingId);
      set((s) => ({
        lists: { ...s.lists, [key]: { data, isLoading: false, error: null } },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load sell cycles';
      set((s) => ({
        lists: { ...s.lists, [key]: { data: [], isLoading: false, error: msg } },
      }));
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
      const data = await sellCyclesService.findOne(id);
      set((s) => ({
        details: { ...s.details, [id]: { data, isLoading: false, error: null } },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load sell cycle';
      set((s) => ({
        details: { ...s.details, [id]: { data: null, isLoading: false, error: msg } },
      }));
    }
  },

  create: async (data) => {
    set({ createLoading: true });
    try {
      const startDate = data.startDate || new Date().toISOString().split('T')[0];
      const result = await sellCyclesService.create({ ...data, startDate: data.startDate || startDate });
      set({ createLoading: false });
      get().fetchList();
      return result;
    } catch (err) {
      set({ createLoading: false });
      throw err;
    }
  },
}));
