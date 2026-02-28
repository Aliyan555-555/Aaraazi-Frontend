'use client';

/**
 * Contacts Zustand Store — replaces React Query useContacts
 */

import { create } from 'zustand';
import { contactsService } from '@/services/contacts.service';
import type {
  CreateContactDto,
  UpdateContactDto,
  QueryContactsDto,
} from '@/services/contacts.service';
import type { Contact as SchemaContact } from '@/types/schema';
import type { ContactStatistics, ContactsListResponse } from '@/services/contacts.service';
import { toast } from 'sonner';

// ============================================================================
// State
// ============================================================================

interface ContactsState {
  // List cache by query key
  listCache: Record<string, ContactsListResponse>;
  listLoading: Record<string, boolean>;
  listError: Record<string, string | null>;

  // Detail cache by id
  detailCache: Record<string, SchemaContact>;
  detailLoading: Record<string, boolean>;
  detailError: Record<string, string | null>;

  // Statistics
  statistics: ContactStatistics | null;
  statisticsLoading: boolean;
  statisticsError: string | null;

  // Mutation loading
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
}

// ============================================================================
// Actions
// ============================================================================

function queryKey(query: QueryContactsDto): string {
  return JSON.stringify(query);
}

interface ContactsActions {
  fetchContacts: (query?: QueryContactsDto) => Promise<ContactsListResponse>;
  fetchContact: (id: string) => Promise<SchemaContact>;
  fetchStatistics: () => Promise<ContactStatistics>;

  createContact: (data: CreateContactDto) => Promise<SchemaContact>;
  updateContact: (id: string, data: UpdateContactDto) => Promise<SchemaContact>;
  deleteContact: (id: string) => Promise<void>;
  bulkUpdate: (ids: string[], updates: UpdateContactDto) => Promise<SchemaContact[]>;
  bulkDelete: (ids: string[]) => Promise<void>;

  invalidateLists: () => void;
  removeDetail: (id: string) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useContactsStore = create<ContactsState & ContactsActions>((set, get) => ({
  listCache: {},
  listLoading: {},
  listError: {},
  detailCache: {},
  detailLoading: {},
  detailError: {},
  statistics: null,
  statisticsLoading: false,
  statisticsError: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,

  fetchContacts: async (query: QueryContactsDto = {}) => {
    const key = queryKey(query);
    set((s) => ({ listLoading: { ...s.listLoading, [key]: true }, listError: { ...s.listError, [key]: null } }));
    try {
      const data = await contactsService.findAll(query);
      set((s) => ({ listCache: { ...s.listCache, [key]: data }, listLoading: { ...s.listLoading, [key]: false } }));
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch contacts';
      set((s) => ({ listError: { ...s.listError, [key]: msg }, listLoading: { ...s.listLoading, [key]: false } }));
      throw err;
    }
  },

  fetchContact: async (id: string) => {
    set((s) => ({ detailLoading: { ...s.detailLoading, [id]: true }, detailError: { ...s.detailError, [id]: null } }));
    try {
      const data = await contactsService.findOne(id);
      set((s) => ({ detailCache: { ...s.detailCache, [id]: data }, detailLoading: { ...s.detailLoading, [id]: false } }));
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch contact';
      set((s) => ({ detailError: { ...s.detailError, [id]: msg }, detailLoading: { ...s.detailLoading, [id]: false } }));
      throw err;
    }
  },

  fetchStatistics: async () => {
    set({ statisticsLoading: true, statisticsError: null });
    try {
      const data = await contactsService.getStatistics();
      set({ statistics: data, statisticsLoading: false });
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch statistics';
      set({ statisticsError: msg, statisticsLoading: false });
      throw err;
    }
  },

  createContact: async (data: CreateContactDto) => {
    set({ createLoading: true });
    try {
      const created = await contactsService.create(data);
      get().invalidateLists();
      set((s) => ({ detailCache: { ...s.detailCache, [created.id]: created }, createLoading: false }));
      toast.success('Contact created successfully');
      return created;
    } catch (err) {
      set({ createLoading: false });
      console.error('Failed to create contact:', err);
      toast.error('Failed to create contact');
      throw err;
    }
  },

  updateContact: async (id: string, data: UpdateContactDto) => {
    set({ updateLoading: true });
    try {
      const updated = await contactsService.update(id, data);
      get().invalidateLists();
      set((s) => ({ detailCache: { ...s.detailCache, [id]: updated }, updateLoading: false }));
      toast.success('Contact updated successfully');
      return updated;
    } catch (err) {
      set({ updateLoading: false });
      console.error('Failed to update contact:', err);
      toast.error('Failed to update contact');
      throw err;
    }
  },

  deleteContact: async (id: string) => {
    set({ deleteLoading: true });
    try {
      await contactsService.remove(id);
      get().removeDetail(id);
      get().invalidateLists();
      set({ deleteLoading: false });
      toast.success('Contact deleted successfully');
    } catch (err) {
      set({ deleteLoading: false });
      console.error('Failed to delete contact:', err);
      toast.error('Failed to delete contact');
      throw err;
    }
  },

  bulkUpdate: async (ids: string[], updates: UpdateContactDto) => {
    const result = await contactsService.bulkUpdate(ids, updates);
    get().invalidateLists();
    toast.success('Contacts updated successfully');
    return result;
  },

  bulkDelete: async (ids: string[]) => {
    await contactsService.bulkDelete(ids);
    ids.forEach((id) => get().removeDetail(id));
    get().invalidateLists();
    toast.success('Contacts deleted successfully');
  },

  invalidateLists: () => {
    set({ listCache: {}, listError: {} });
  },

  removeDetail: (id: string) => {
    set((s) => {
      const { [id]: _, ...rest } = s.detailCache;
      return { detailCache: rest };
    });
  },
}));
