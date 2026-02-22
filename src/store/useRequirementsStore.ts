/**
 * Requirements Zustand Store
 */

'use client';

import { create } from 'zustand';
import { listRequirements } from '@/lib/api/requirements';

export type RequirementItem = Awaited<ReturnType<typeof listRequirements>>[number];

export interface RequirementsStore {
  items: RequirementItem[];
  isLoading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
}

export const useRequirementsStore = create<RequirementsStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await listRequirements();
      set({ items: data, isLoading: false });
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load requirements';
      set({ items: [], isLoading: false, error: msg });
    }
  },
}));
