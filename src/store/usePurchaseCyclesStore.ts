/**
 * Purchase Cycles Zustand Store
 */

'use client';

import { create } from 'zustand';
import { purchaseCyclesService } from '@/services/purchase-cycles.service';
import type {
  CreatePurchaseCyclePayload,
  CreatePurchaseCycleFromPropertyPayload,
} from '@/services/purchase-cycles.service';

export type PurchaseCycleApiSingle = Awaited<ReturnType<typeof purchaseCyclesService.findOne>>;
export type PurchaseCycleApiList = Awaited<ReturnType<typeof purchaseCyclesService.findAll>>;

export interface PurchaseCyclesStore {
  lists: Record<string, { data: PurchaseCycleApiList; isLoading: boolean; error: string | null }>;
  details: Record<string, { data: PurchaseCycleApiSingle | null; isLoading: boolean; error: string | null }>;
  createLoading: boolean;

  fetchList: (requirementId?: string) => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  create: (data: CreatePurchaseCyclePayload) => Promise<Awaited<ReturnType<typeof purchaseCyclesService.create>>>;
  createFromProperty: (
    data: CreatePurchaseCycleFromPropertyPayload
  ) => Promise<Awaited<ReturnType<typeof purchaseCyclesService.createFromProperty>>>;
}

function listKey(requirementId?: string): string {
  return requirementId ?? '__all__';
}

export const usePurchaseCyclesStore = create<PurchaseCyclesStore>((set, get) => ({
  lists: {},
  details: {},
  createLoading: false,

  fetchList: async (requirementId) => {
    const key = listKey(requirementId);
    set((s) => ({
      lists: {
        ...s.lists,
        [key]: { data: s.lists[key]?.data ?? [], isLoading: true, error: null },
      },
    }));
    try {
      const data = await purchaseCyclesService.findAll(requirementId);
      set((s) => ({
        lists: { ...s.lists, [key]: { data, isLoading: false, error: null } },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load purchase cycles';
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
      const data = await purchaseCyclesService.findOne(id);
      set((s) => ({
        details: { ...s.details, [id]: { data, isLoading: false, error: null } },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load purchase cycle';
      set((s) => ({
        details: { ...s.details, [id]: { data: null, isLoading: false, error: msg } },
      }));
    }
  },

  create: async (data) => {
    set({ createLoading: true });
    try {
      const result = await purchaseCyclesService.create(data);
      set({ createLoading: false });
      get().fetchList();
      return result;
    } catch (err) {
      set({ createLoading: false });
      throw err;
    }
  },

  createFromProperty: async (data) => {
    set({ createLoading: true });
    try {
      const result = await purchaseCyclesService.createFromProperty(data);
      set({ createLoading: false });
      get().fetchList();
      return result;
    } catch (err) {
      set({ createLoading: false });
      throw err;
    }
  },
}));
