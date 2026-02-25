/**
 * Professional-grade Contacts Store with Zustand
 * Centralized state management for contacts with proper typing
 */

import { create } from 'zustand';
import type { Contact } from '@/types/schema';
import type { ApiError } from '@/types/auth.types';
import {
  contactsService,
  type CreateContactDto,
  type UpdateContactDto,
  type QueryContactsDto,
  type ContactStatistics,
} from '@/services/contacts.service';

// ============================================================================
// Contacts Store State Interface
// ============================================================================

export interface ContactsStore {
  // State
  contacts: Contact[];
  currentContact: Contact | null;
  statistics: ContactStatistics | null;
  total: number;
  page: number;
  limit: number;
  pages: number;

  // Loading & Error States
  isLoading: boolean;
  isInitialized: boolean;
  error: ApiError | null;

  // Filters
  filters: QueryContactsDto;

  // Actions
  setFilters: (filters: QueryContactsDto) => void;
  clearFilters: () => void;

  // CRUD Actions
  fetchContacts: (query?: QueryContactsDto) => Promise<void>;
  fetchContact: (id: string) => Promise<Contact>;
  createContact: (dto: CreateContactDto) => Promise<Contact>;
  updateContact: (id: string, dto: UpdateContactDto) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  bulkUpdateContacts: (ids: string[], updates: UpdateContactDto) => Promise<void>;
  bulkDeleteContacts: (ids: string[]) => Promise<void>;

  // Statistics
  fetchStatistics: () => Promise<ContactStatistics>;

  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  contacts: [],
  currentContact: null,
  statistics: null,
  total: 0,
  page: 1,
  limit: 20,
  pages: 0,
  isLoading: false,
  isInitialized: false,
  error: null,
  filters: {},
};

// ============================================================================
// Contacts Store
// ============================================================================

export const useContactsStore = create<ContactsStore>()((set, get) => ({
  ...initialState,

  // ========================================================================
  // Basic Setters
  // ========================================================================

  setFilters: (filters) => {
    set({ filters, error: null });
  },

  clearFilters: () => {
    set({ filters: {}, error: null });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  clearError: () => {
    set({ error: null });
  },

  // ========================================================================
  // Fetch Contacts
  // ========================================================================

  fetchContacts: async (query) => {
    try {
      set({ isLoading: true, error: null });

      const mergedQuery = { ...get().filters, ...query };
      const response = await contactsService.findAll(mergedQuery);

      set({
        contacts: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
        pages: response.pages,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
        contacts: [],
        total: 0,
      });
      throw error;
    }
  },

  // ========================================================================
  // Fetch Single Contact
  // ========================================================================

  fetchContact: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const contact = await contactsService.findOne(id);

      set({
        currentContact: contact,
        isLoading: false,
        error: null,
      });

      return contact;
    } catch (error) {
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
      });
      throw error;
    }
  },

  // ========================================================================
  // Create Contact
  // ========================================================================

  createContact: async (dto) => {
    try {
      set({ isLoading: true, error: null });

      const contact = await contactsService.create(dto);

      // Add to local state
      set((state) => ({
        contacts: [contact, ...state.contacts],
        total: state.total + 1,
        isLoading: false,
        error: null,
      }));

      return contact;
    } catch (error) {
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
      });
      throw error;
    }
  },

  // ========================================================================
  // Update Contact
  // ========================================================================

  updateContact: async (id, dto) => {
    try {
      set({ isLoading: true, error: null });

      const updated = await contactsService.update(id, dto);

      // Update in local state
      set((state) => ({
        contacts: state.contacts.map((contact) =>
          contact.id === id ? updated : contact
        ),
        currentContact:
          state.currentContact?.id === id ? updated : state.currentContact,
        isLoading: false,
        error: null,
      }));

      return updated;
    } catch (error) {
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
      });
      throw error;
    }
  },

  // ========================================================================
  // Delete Contact
  // ========================================================================

  deleteContact: async (id) => {
    try {
      set({ isLoading: true, error: null });

      await contactsService.remove(id);

      // Remove from local state
      set((state) => ({
        contacts: state.contacts.filter((contact) => contact.id !== id),
        total: state.total - 1,
        currentContact:
          state.currentContact?.id === id ? null : state.currentContact,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
      });
      throw error;
    }
  },

  // ========================================================================
  // Bulk Update Contacts
  // ========================================================================

  bulkUpdateContacts: async (ids, updates) => {
    try {
      set({ isLoading: true, error: null });

      const updatedContacts = await contactsService.bulkUpdate(ids, updates);

      // Update in local state
      const updatedMap = new Map(updatedContacts.map((c) => [c.id, c]));
      set((state) => ({
        contacts: state.contacts.map((contact) =>
          updatedMap.has(contact.id) ? updatedMap.get(contact.id)! : contact
        ),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
      });
      throw error;
    }
  },

  // ========================================================================
  // Bulk Delete Contacts
  // ========================================================================

  bulkDeleteContacts: async (ids) => {
    try {
      set({ isLoading: true, error: null });

      await contactsService.bulkDelete(ids);

      // Remove from local state
      set((state) => ({
        contacts: state.contacts.filter((contact) => !ids.includes(contact.id)),
        total: state.total - ids.length,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
      });
      throw error;
    }
  },

  // ========================================================================
  // Fetch Statistics
  // ========================================================================

  fetchStatistics: async () => {
    try {
      const statistics = await contactsService.getStatistics();

      set({
        statistics,
      });

      return statistics;
    } catch (error) {
      console.error('Failed to fetch contact statistics:', error);
      throw error;
    }
  },

  // ========================================================================
  // Reset Action
  // ========================================================================

  reset: () => {
    set({
      ...initialState,
      isInitialized: true,
    });
  },
}));

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectContacts = (state: ContactsStore) => state.contacts;
export const selectCurrentContact = (state: ContactsStore) => state.currentContact;
export const selectIsLoading = (state: ContactsStore) => state.isLoading;
export const selectError = (state: ContactsStore) => state.error;
export const selectFilters = (state: ContactsStore) => state.filters;
export const selectStatistics = (state: ContactsStore) => state.statistics;
export const selectPagination = (state: ContactsStore) => ({
  total: state.total,
  page: state.page,
  limit: state.limit,
  pages: state.pages,
});
