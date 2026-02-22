/**
 * Deals Zustand Store
 */

'use client';

import { create } from 'zustand';
import {
  dealsService,
  type ProgressStagePayload,
  type RecordPaymentPayload,
  type CreatePaymentSchedulePayload,
  type UpdateDealPayload,
  type UpsertCommissionsPayload,
  type UpdateCommissionStatusPayload,
  type CreateDealTaskPayload,
  type UpdateDealTaskPayload,
  type AddInstallmentPayload,
} from '@/services/deals.service';
import type { Deal } from '@/types/deals';

function getErrorMessage(err: unknown): string {
  return err && typeof err === 'object' && 'message' in err
    ? String((err as { message: string }).message)
    : 'Operation failed';
}

export interface DealsStore {
  list: { data: Deal[]; isLoading: boolean; error: string | null };
  details: Record<string, { data: Deal | null; isLoading: boolean; error: string | null }>;
  mutateLoading: boolean;
  mutateError: string | null;

  fetchList: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;

  updateDeal: (id: string, payload: UpdateDealPayload) => Promise<void>;
  progressStage: (id: string, payload: ProgressStagePayload) => Promise<void>;
  recordPayment: (id: string, payload: RecordPaymentPayload) => Promise<void>;
  createPaymentSchedule: (id: string, payload: CreatePaymentSchedulePayload) => Promise<void>;
  createNote: (dealId: string, content: string) => Promise<void>;
  createDocument: (
    dealId: string,
    payload: { name: string; url: string; type: string; category: string },
  ) => Promise<void>;
  completeDeal: (id: string) => Promise<void>;
  cancelDeal: (id: string, reason: string) => Promise<void>;
  upsertCommissions: (dealId: string, payload: UpsertCommissionsPayload) => Promise<void>;
  updateCommissionStatus: (
    dealId: string,
    commissionId: string,
    payload: UpdateCommissionStatusPayload,
  ) => Promise<void>;
  createDealTask: (dealId: string, payload: CreateDealTaskPayload) => Promise<void>;
  updateDealTask: (
    dealId: string,
    taskId: string,
    payload: UpdateDealTaskPayload,
  ) => Promise<void>;
  addInstallment: (
    dealId: string,
    scheduleId: string,
    payload: AddInstallmentPayload,
  ) => Promise<void>;
}

export const useDealsStore = create<DealsStore>((set, get) => ({
  list: { data: [], isLoading: true, error: null },
  details: {},
  mutateLoading: false,
  mutateError: null,

  fetchList: async () => {
    set((s) => ({ list: { ...s.list, isLoading: true, error: null } }));
    try {
      const data = await dealsService.findAll();
      set({ list: { data, isLoading: false, error: null } });
    } catch (err) {
      set({ list: { data: [], isLoading: false, error: getErrorMessage(err) } });
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
      set((s) => ({
        details: {
          ...s.details,
          [id]: { data: null, isLoading: false, error: getErrorMessage(err) },
        },
      }));
    }
  },

  updateDeal: async (id, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.updateDeal(id, payload);
      await get().fetchDetail(id);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  progressStage: async (id, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.progressStage(id, payload);
      await get().fetchDetail(id);
      await get().fetchList();
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  recordPayment: async (id, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.recordPayment(id, payload);
      await get().fetchDetail(id);
      await get().fetchList();
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  createPaymentSchedule: async (id, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.createPaymentSchedule(id, payload);
      await get().fetchDetail(id);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  createNote: async (dealId, content) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.createNote(dealId, content);
      await get().fetchDetail(dealId);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  createDocument: async (dealId, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.createDocument(dealId, payload);
      await get().fetchDetail(dealId);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  completeDeal: async (id) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.completeDeal(id);
      await get().fetchDetail(id);
      await get().fetchList();
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  cancelDeal: async (id, reason) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.cancelDeal(id, reason);
      await get().fetchDetail(id);
      await get().fetchList();
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  upsertCommissions: async (dealId, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.upsertCommissions(dealId, payload);
      await get().fetchDetail(dealId);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  updateCommissionStatus: async (dealId, commissionId, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.updateCommissionStatus(dealId, commissionId, payload);
      await get().fetchDetail(dealId);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  createDealTask: async (dealId, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.createDealTask(dealId, payload);
      await get().fetchDetail(dealId);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  updateDealTask: async (dealId, taskId, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.updateDealTask(dealId, taskId, payload);
      await get().fetchDetail(dealId);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },

  addInstallment: async (dealId, scheduleId, payload) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await dealsService.addInstallment(dealId, scheduleId, payload);
      await get().fetchDetail(dealId);
      set({ mutateLoading: false, mutateError: null });
    } catch (err) {
      set({ mutateLoading: false, mutateError: getErrorMessage(err) });
      throw err;
    }
  },
}));
