import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ManagedDocument {
  id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'sent';
  data: Record<string, unknown>;
  tags: string[];
  createdBy: string;
}

export interface ManagedDocumentsStore {
  documents: ManagedDocument[];
  setDocuments: (documents: ManagedDocument[]) => void;
  addDocument: (document: ManagedDocument) => void;
  updateDocument: (id: string, updates: Partial<ManagedDocument>) => void;
  removeDocument: (id: string) => void;
}

export const useManagedDocumentsStore = create<ManagedDocumentsStore>()(
  persist(
    (set) => ({
      documents: [],

      setDocuments: (documents) => set({ documents }),

      addDocument: (document) =>
        set((state) => ({
          documents: [...state.documents, document],
        })),

      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? { ...d, ...updates, updatedAt: new Date().toISOString() }
              : d
          ),
        })),

      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),
    }),
    {
      name: 'aaraazi-managed-documents',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined!)),
    }
  )
);
