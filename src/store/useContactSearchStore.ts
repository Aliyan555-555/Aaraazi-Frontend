/**
 * Contact Search Zustand Store
 * Debounced search results
 */

'use client';

import { create } from 'zustand';
import { contactsService } from '@/services/contacts.service';
import type { Contact } from '@/types/schema';

const DEBOUNCE_MS = 300;

let searchTimer: ReturnType<typeof setTimeout> | null = null;

export interface ContactSearchStore {
  results: Contact[];
  isLoading: boolean;

  search: (query: string, limit?: number, agentId?: string) => void;
  clear: () => void;
}

export const useContactSearchStore = create<ContactSearchStore>((set) => ({
  results: [],
  isLoading: false,

  search: (query, limit = 10, agentId) => {
    if (searchTimer) clearTimeout(searchTimer);

    if (!query || query.length < 2) {
      set({ results: [], isLoading: false });
      return;
    }

    searchTimer = setTimeout(async () => {
      searchTimer = null;
      set({ isLoading: true });
      try {
        const response = await contactsService.findAll({
          search: query,
          limit,
          ...(agentId && { agentId }),
        });
        set({ results: response.data || [], isLoading: false });
      } catch (err) {
        console.error('Contact search failed:', err);
        set({ results: [], isLoading: false });
      }
    }, DEBOUNCE_MS);
  },

  clear: () => {
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    set({ results: [], isLoading: false });
  },
}));
