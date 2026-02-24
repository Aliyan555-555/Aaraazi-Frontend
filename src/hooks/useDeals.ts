/**
 * Deals Hooks - Zustand-based
 * useDeals() - list all deals
 * useDeal(id) - single deal by id
 * useDealMutations() - create, update, progress, payments, notes, documents, complete, cancel
 */

'use client';

import { useEffect } from 'react';
import { useDealsStore } from '@/store/useDealsStore';

const EMPTY_DEAL_DETAIL = { data: null, isLoading: true, error: null };
const EMPTY_DEAL_DETAIL_OFF = { data: null, isLoading: false, error: null };

export function useDeals() {
  const list = useDealsStore((s) => s.list);

  useEffect(() => {
    useDealsStore.getState().fetchList();
  }, []);

  return {
    deals: list.data,
    isLoading: list.isLoading,
    error: list.error,
    refetch: () => useDealsStore.getState().fetchList(),
  };
}

export function useDeal(id: string | undefined, enabled = true) {
  const entry = useDealsStore((s) => (id ? (s.details[id] ?? EMPTY_DEAL_DETAIL) : EMPTY_DEAL_DETAIL_OFF));

  useEffect(() => {
    if (enabled && id) {
      useDealsStore.getState().fetchDetail(id);
    }
  }, [id, enabled]);

  return {
    deal: entry.data,
    isLoading: entry.isLoading,
    error: entry.error,
    refetch: () => (id ? useDealsStore.getState().fetchDetail(id, { silent: !!entry.data }) : Promise.resolve()),
  };
}

/**
 * Deal mutations - progress stage, payments, notes, documents, complete, cancel.
 * Mirror of usePropertyMutations; use instead of calling dealsService directly.
 */
export function useDealMutations() {
  const mutateLoading = useDealsStore((s) => s.mutateLoading);
  const mutateError = useDealsStore((s) => s.mutateError);
  const progressStageLoading = useDealsStore((s) => s.progressStageLoading);
  const recordPaymentLoading = useDealsStore((s) => s.recordPaymentLoading);
  return {
    updateDeal: useDealsStore.getState().updateDeal,
    progressStage: useDealsStore.getState().progressStage,
    recordPayment: useDealsStore.getState().recordPayment,
    createPaymentSchedule: useDealsStore.getState().createPaymentSchedule,
    createNote: useDealsStore.getState().createNote,
    createDocument: useDealsStore.getState().createDocument,
    completeDeal: useDealsStore.getState().completeDeal,
    cancelDeal: useDealsStore.getState().cancelDeal,
    upsertCommissions: useDealsStore.getState().upsertCommissions,
    updateCommissionStatus: useDealsStore.getState().updateCommissionStatus,
    createDealTask: useDealsStore.getState().createDealTask,
    updateDealTask: useDealsStore.getState().updateDealTask,
    addInstallment: useDealsStore.getState().addInstallment,
    isLoading: mutateLoading,
    error: mutateError,
    progressStageLoading,
    recordPaymentLoading,
  };
}
