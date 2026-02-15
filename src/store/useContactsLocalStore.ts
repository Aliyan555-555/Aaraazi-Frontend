/**
 * Local contacts state (Zustand + persist).
 * Replaces localStorage for contacts when using data.ts getContacts/addContact etc.
 * Single source of truth; no demo data.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Contact } from '@/types/contacts';

export interface ContactsLocalStore {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
}

export const useContactsLocalStore = create<ContactsLocalStore>()(
  persist(
    (set) => ({
      contacts: [],

      setContacts: (contacts) => set({ contacts }),

      addContact: (contact) =>
        set((state) => ({
          contacts: [...state.contacts, contact],
        })),

      updateContact: (id, updates) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),

      deleteContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'aaraazi-contacts-local',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined!)),
    }
  )
);
