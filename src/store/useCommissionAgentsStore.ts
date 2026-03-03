/**
 * Commission Agents Zustand Store
 * External brokers from API
 */

'use client';

import { create } from 'zustand';
import { commissionService } from '@/services/commission.service';
import type { AgentOption } from '@/services/commission.service';

export interface CommissionAgentsStore {
  brokers: AgentOption[];
  isLoading: boolean;
  error: string | null;

  fetchBrokers: () => Promise<void>;
  clear: () => void;
}

export const useCommissionAgentsStore = create<CommissionAgentsStore>((set) => ({
  brokers: [],
  isLoading: false,
  error: null,

  fetchBrokers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await commissionService.getExternalBrokers();
      set({ brokers: data, isLoading: false });
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load external brokers';
      set({ brokers: [], isLoading: false, error: msg });
    }
  },

  clear: () => set({ brokers: [], error: null }),
}));
