/**
 * Rent Cycles Zustand Store
 */

'use client';

import { create } from 'zustand';
import { rentCyclesService } from '@/services/rent-cycles.service';
import type { CreateRentCyclePayload, UpdateRentCyclePayload } from '@/services/rent-cycles.service';

export type RentCycleApiSingle = Awaited<ReturnType<typeof rentCyclesService.findOne>>;
export type RentCycleApiList = Awaited<ReturnType<typeof rentCyclesService.findAll>>;

export interface RentCyclesStore {
  lists: Record<string, { data: RentCycleApiList; isLoading: boolean; error: string | null }>;
  details: Record<string, { data: RentCycleApiSingle | null; isLoading: boolean; error: string | null }>;
  mutateLoading: boolean;

  fetchList: (propertyListingId?: string) => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  create: (data: CreateRentCyclePayload) => Promise<Awaited<ReturnType<typeof rentCyclesService.create>>>;
  update: (id: string, data: UpdateRentCyclePayload) => Promise<Awaited<ReturnType<typeof rentCyclesService.update>>>;
}

function listKey(propertyListingId?: string): string {
  return propertyListingId ?? '__all__';
}

export const useRentCyclesStore = create<RentCyclesStore>((set, get) => ({
  lists: {},
  details: {},
  mutateLoading: false,

  fetchList: async (propertyListingId) => {
    const key = listKey(propertyListingId);
    set((s) => ({
      lists: {
        ...s.lists,
        [key]: { data: s.lists[key]?.data ?? [], isLoading: true, error: null },
      },
    }));
    try {
      const data = await rentCyclesService.findAll(propertyListingId);
      set((s) => ({
        lists: { ...s.lists, [key]: { data, isLoading: false, error: null } },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load rent cycles';
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
      const data = await rentCyclesService.findOne(id);
      set((s) => ({
        details: { ...s.details, [id]: { data, isLoading: false, error: null } },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load rent cycle';
      set((s) => ({
        details: { ...s.details, [id]: { data: null, isLoading: false, error: msg } },
      }));
    }
  },

  create: async (data) => {
    set({ mutateLoading: true });
    try {
      const result = await rentCyclesService.create(data);
      set({ mutateLoading: false });
      get().fetchList();
      return result;
    } catch (err) {
      set({ mutateLoading: false });
      throw err;
    }
  },

  update: async (id, data) => {
    set({ mutateLoading: true });
    try {
      const result = await rentCyclesService.update(id, data);
      set((s) => {
        const next = { ...s.details };
        delete next[id];
        return { details: next, mutateLoading: false };
      });
      get().fetchList();
      return result;
    } catch (err) {
      set({ mutateLoading: false });
      throw err;
    }
  },
}));
