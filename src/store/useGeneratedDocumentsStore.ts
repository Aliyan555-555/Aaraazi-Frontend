/**
 * Local generated documents state (Zustand + persist).
 * Replaces localStorage for lib/documents.ts (GeneratedDocument).
 * No demo data.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GeneratedDocument } from '@/types/documents';

export interface GeneratedDocumentsStore {
  documents: GeneratedDocument[];
  setDocuments: (documents: GeneratedDocument[]) => void;
  addDocument: (document: GeneratedDocument) => void;
  removeDocument: (documentId: string) => void;
}

export const useGeneratedDocumentsStore = create<GeneratedDocumentsStore>()(
  persist(
    (set) => ({
      documents: [],

      setDocuments: (documents) => set({ documents }),

      addDocument: (document) =>
        set((state) => ({
          documents: [...state.documents, document],
        })),

      removeDocument: (documentId) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== documentId),
        })),
    }),
    {
      name: 'aaraazi-generated-documents',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined!)),
    }
  )
);
