/**
 * Contacts Zustand Store
 * Replaces React Query for contacts - single source of truth
 */

'use client';

import { create } from 'zustand';
import { contactsService } from '@/services/contacts.service';
import type { Contact } from '@/types/schema';
import type {
  CreateContactDto,
  UpdateContactDto,
  QueryContactsDto,
  ContactStatistics,
} from '@/services/contacts.service';
import { toast } from 'sonner';

// ============================================================================
// Helpers
// ============================================================================

function queryKey(query: QueryContactsDto): string {
  const sorted = Object.keys(query)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: (query as Record<string, unknown>)[k] }), {});
  return JSON.stringify(sorted);
}

const emptyListEntry = {
  data: [] as Contact[],
  pagination: { total: 0, page: 1, limit: 10, pages: 0 },
  isLoading: false,
  error: null as string | null,
};

const emptyDetailEntry = {
  data: null as Contact | null,
  isLoading: false,
  error: null as string | null,
};

// ============================================================================
// Types
// ============================================================================

interface ContactsListEntry {
  data: Contact[];
  pagination: { total: number; page: number; limit: number; pages: number };
  isLoading: boolean;
  error: string | null;
}

interface ContactsDetailEntry {
  data: Contact | null;
  isLoading: boolean;
  error: string | null;
}

interface ContactsStatisticsEntry {
  data: ContactStatistics | null;
  isLoading: boolean;
  error: string | null;
}

export interface ContactsStore {
  lists: Record<string, ContactsListEntry>;
  details: Record<string, ContactsDetailEntry>;
  statistics: ContactsStatisticsEntry;
  mutateLoading: boolean;
  mutateError: string | null;

  fetchList: (query: QueryContactsDto) => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  create: (dto: CreateContactDto) => Promise<Contact>;
  update: (id: string, dto: UpdateContactDto) => Promise<Contact>;
  remove: (id: string) => Promise<void>;
  bulkUpdate: (ids: string[], updates: UpdateContactDto) => Promise<Contact[]>;
  bulkDelete: (ids: string[]) => Promise<void>;
  invalidateAll: () => void;
  prefetchDetail: (id: string) => Promise<void>;
}

// ============================================================================
// Store
// ============================================================================

export const useContactsStore = create<ContactsStore>((set, get) => ({
  lists: {},
  details: {},
  statistics: { data: null, isLoading: false, error: null },
  mutateLoading: false,
  mutateError: null,

  fetchList: async (query) => {
    const key = queryKey(query);
    set((s) => ({
      lists: {
        ...s.lists,
        [key]: {
          ...(s.lists[key] ?? emptyListEntry),
          isLoading: true,
          error: null,
        },
      },
    }));
    try {
      const response = await contactsService.findAll(query);
      const entry: ContactsListEntry = {
        data: response.data ?? [],
        pagination: {
          total: response.total ?? 0,
          page: response.page ?? 1,
          limit: response.limit ?? 10,
          pages: response.pages ?? 0,
        },
        isLoading: false,
        error: null,
      };
      set((s) => ({
        lists: { ...s.lists, [key]: entry },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load contacts';
      set((s) => ({
        lists: {
          ...s.lists,
          [key]: {
            ...(s.lists[key] ?? emptyListEntry),
            data: [],
            isLoading: false,
            error: msg,
          },
        },
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
      const contact = await contactsService.findOne(id);
      set((s) => ({
        details: {
          ...s.details,
          [id]: { data: contact, isLoading: false, error: null },
        },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load contact';
      set((s) => ({
        details: {
          ...s.details,
          [id]: { data: null, isLoading: false, error: msg },
        },
      }));
    }
  },

  fetchStatistics: async () => {
    set((s) => ({
      statistics: { ...s.statistics, isLoading: true, error: null },
    }));
    try {
      const data = await contactsService.getStatistics();
      set((s) => ({
        statistics: { data, isLoading: false, error: null },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load contact statistics';
      set((s) => ({
        statistics: { data: null, isLoading: false, error: msg },
      }));
    }
  },

  create: async (dto) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      const newContact = await contactsService.create(dto);
      set((s) => ({
        details: {
          ...s.details,
          [newContact.id]: { data: newContact, isLoading: false, error: null },
        },
        mutateLoading: false,
      }));
      get().invalidateAll();
      toast.success('Contact created successfully');
      return newContact;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to create contact';
      set({ mutateLoading: false, mutateError: msg });
      toast.error('Failed to create contact');
      throw err;
    }
  },

  update: async (id, dto) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      const updated = await contactsService.update(id, dto);
      set((s) => ({
        details: {
          ...s.details,
          [id]: { data: updated, isLoading: false, error: null },
        },
        mutateLoading: false,
      }));
      get().invalidateAll();
      toast.success('Contact updated successfully');
      return updated;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to update contact';
      set({ mutateLoading: false, mutateError: msg });
      toast.error('Failed to update contact');
      throw err;
    }
  },

  remove: async (id) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await contactsService.remove(id);
      set((s) => {
        const next = { ...s.details };
        delete next[id];
        return { details: next, mutateLoading: false };
      });
      get().invalidateAll();
      toast.success('Contact deleted successfully');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to delete contact';
      set({ mutateLoading: false, mutateError: msg });
      toast.error('Failed to delete contact');
      throw err;
    }
  },

  bulkUpdate: async (ids, updates) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      const result = await contactsService.bulkUpdate(ids, updates);
      set({ mutateLoading: false });
      get().invalidateAll();
      toast.success('Contacts updated successfully');
      return result;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to bulk update contacts';
      set({ mutateLoading: false, mutateError: msg });
      toast.error('Failed to update contacts');
      throw err;
    }
  },

  bulkDelete: async (ids) => {
    set({ mutateLoading: true, mutateError: null });
    try {
      await contactsService.bulkDelete(ids);
      set((s) => {
        const next = { ...s.details };
        ids.forEach((id) => delete next[id]);
        return { details: next, mutateLoading: false };
      });
      get().invalidateAll();
      toast.success('Contacts deleted successfully');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to bulk delete contacts';
      set({ mutateLoading: false, mutateError: msg });
      toast.error('Failed to delete contacts');
      throw err;
    }
  },

  invalidateAll: () => {
    set({ lists: {} });
    // Keep details cache - components can refetch via fetchDetail
  },

  prefetchDetail: async (id) => {
    const existing = get().details[id];
    if (existing?.data && !existing.error) return;
    return get().fetchDetail(id);
  },
}));
