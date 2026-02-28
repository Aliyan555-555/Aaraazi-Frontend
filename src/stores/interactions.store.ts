'use client';

/**
 * Interactions Zustand Store — replaces React Query useInteractions
 */

import { create } from 'zustand';
import { interactionsService } from '@/services/interactions.service';
import type {
  CreateInteractionDto,
  UpdateInteractionDto,
  QueryInteractionsDto,
} from '@/services/interactions.service';
import type {
  Interaction,
  ContactInteractionSummary,
  InteractionsListResponse,
} from '@/services/interactions.service';
import { toast } from 'sonner';

// ============================================================================
// State
// ============================================================================

interface InteractionsState {
  listCache: Record<string, InteractionsListResponse>;
  listLoading: Record<string, boolean>;
  listError: Record<string, string | null>;

  detailCache: Record<string, Interaction>;
  detailLoading: Record<string, boolean>;
  detailError: Record<string, string | null>;

  summaryCache: Record<string, ContactInteractionSummary>;
  summaryLoading: Record<string, boolean>;
  summaryError: Record<string, string | null>;

  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
}

function queryKey(query: QueryInteractionsDto): string {
  return JSON.stringify(query);
}

interface InteractionsActions {
  fetchInteractions: (query?: QueryInteractionsDto) => Promise<InteractionsListResponse>;
  fetchInteraction: (id: string) => Promise<Interaction>;
  fetchContactSummary: (contactId: string) => Promise<ContactInteractionSummary>;

  createInteraction: (data: CreateInteractionDto) => Promise<Interaction>;
  updateInteraction: (id: string, data: UpdateInteractionDto) => Promise<Interaction>;
  deleteInteraction: (id: string) => Promise<void>;

  invalidateLists: () => void;
  invalidateContactSummary: (contactId: string) => void;
  removeDetail: (id: string) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useInteractionsStore = create<InteractionsState & InteractionsActions>((set, get) => ({
  listCache: {},
  listLoading: {},
  listError: {},
  detailCache: {},
  detailLoading: {},
  detailError: {},
  summaryCache: {},
  summaryLoading: {},
  summaryError: {},
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,

  fetchInteractions: async (query: QueryInteractionsDto = {}) => {
    const key = queryKey(query);
    set((s) => ({ listLoading: { ...s.listLoading, [key]: true }, listError: { ...s.listError, [key]: null } }));
    try {
      const data = await interactionsService.findAll(query);
      set((s) => ({ listCache: { ...s.listCache, [key]: data }, listLoading: { ...s.listLoading, [key]: false } }));
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch interactions';
      set((s) => ({ listError: { ...s.listError, [key]: msg }, listLoading: { ...s.listLoading, [key]: false } }));
      throw err;
    }
  },

  fetchInteraction: async (id: string) => {
    set((s) => ({ detailLoading: { ...s.detailLoading, [id]: true }, detailError: { ...s.detailError, [id]: null } }));
    try {
      const data = await interactionsService.findOne(id);
      set((s) => ({ detailCache: { ...s.detailCache, [id]: data }, detailLoading: { ...s.detailLoading, [id]: false } }));
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch interaction';
      set((s) => ({ detailError: { ...s.detailError, [id]: msg }, detailLoading: { ...s.detailLoading, [id]: false } }));
      throw err;
    }
  },

  fetchContactSummary: async (contactId: string) => {
    set((s) => ({
      summaryLoading: { ...s.summaryLoading, [contactId]: true },
      summaryError: { ...s.summaryError, [contactId]: null },
    }));
    try {
      const data = await interactionsService.getContactSummary(contactId);
      set((s) => ({
        summaryCache: { ...s.summaryCache, [contactId]: data },
        summaryLoading: { ...s.summaryLoading, [contactId]: false },
      }));
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch summary';
      set((s) => ({
        summaryError: { ...s.summaryError, [contactId]: msg },
        summaryLoading: { ...s.summaryLoading, [contactId]: false },
      }));
      throw err;
    }
  },

  createInteraction: async (data: CreateInteractionDto) => {
    set({ createLoading: true });
    try {
      const created = await interactionsService.create(data);
      get().invalidateLists();
      if (created.contactId) get().invalidateContactSummary(created.contactId);
      set((s) => ({ detailCache: { ...s.detailCache, [created.id]: created }, createLoading: false }));
      toast.success('Interaction logged successfully');
      return created;
    } catch (err) {
      set({ createLoading: false });
      console.error('Failed to log interaction:', err);
      toast.error('Failed to log interaction');
      throw err;
    }
  },

  updateInteraction: async (id: string, data: UpdateInteractionDto) => {
    set({ updateLoading: true });
    try {
      const updated = await interactionsService.update(id, data);
      set((s) => ({ detailCache: { ...s.detailCache, [id]: updated }, updateLoading: false }));
      get().invalidateLists();
      if (updated.contactId) get().invalidateContactSummary(updated.contactId);
      toast.success('Interaction updated successfully');
      return updated;
    } catch (err) {
      set({ updateLoading: false });
      console.error('Failed to update interaction:', err);
      toast.error('Failed to update interaction');
      throw err;
    }
  },

  deleteInteraction: async (id: string) => {
    set({ deleteLoading: true });
    try {
      await interactionsService.remove(id);
      get().removeDetail(id);
      get().invalidateLists();
      set({ deleteLoading: false });
      toast.success('Interaction deleted');
    } catch (err) {
      set({ deleteLoading: false });
      console.error('Failed to delete interaction:', err);
      toast.error('Failed to delete interaction');
      throw err;
    }
  },

  invalidateLists: () => set({ listCache: {}, listError: {} }),

  invalidateContactSummary: (contactId: string) => {
    set((s) => {
      const next = { ...s.summaryCache };
      delete next[contactId];
      return { summaryCache: next, summaryError: { ...s.summaryError, [contactId]: null } };
    });
  },

  removeDetail: (id: string) => {
    set((s) => {
      const next = { ...s.detailCache };
      delete next[id];
      return { detailCache: next };
    });
  },
}));
