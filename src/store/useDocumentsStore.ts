/**
 * Professional-grade Documents Store with Zustand
 * Centralized state management for documents with proper typing
 */

import { create } from 'zustand';
import type { GeneratedDocument } from '@/types/documents';
import type { ApiError } from '@/types/auth.types';
import {
  documentsService,
  type CreateDocumentDto,
  type UpdateDocumentDto,
  type QueryDocumentsDto,
  type GeneratePdfBrandingDto,
  type UploadDocumentDto,
} from '@/services/documents.service';

// ============================================================================
// Documents Store State Interface
// ============================================================================

export interface DocumentsStore {
  // State
  documents: GeneratedDocument[];
  currentDocument: GeneratedDocument | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  // Loading & Error States
  isLoading: boolean;
  isInitialized: boolean;
  error: ApiError | null;

  // Filters
  filters: QueryDocumentsDto;

  // Actions
  setFilters: (filters: QueryDocumentsDto) => void;
  clearFilters: () => void;

  // CRUD Actions
  fetchDocuments: (query?: QueryDocumentsDto) => Promise<void>;
  fetchDocument: (id: string) => Promise<GeneratedDocument>;
  createDocument: (dto: CreateDocumentDto) => Promise<GeneratedDocument>;
  updateDocument: (id: string, dto: UpdateDocumentDto) => Promise<GeneratedDocument>;
  deleteDocument: (id: string) => Promise<void>;
  bulkDeleteDocuments: (ids: string[]) => Promise<void>;

  // File Operations
  uploadDocument: (file: File, metadata: UploadDocumentDto) => Promise<GeneratedDocument>;
  generatePdf: (id: string, branding?: GeneratePdfBrandingDto) => Promise<Blob>;
  downloadPdf: (id: string, fileName?: string, branding?: GeneratePdfBrandingDto) => Promise<void>;

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
  documents: [],
  currentDocument: null,
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  isLoading: false,
  isInitialized: false,
  error: null,
  filters: {},
};

// ============================================================================
// Documents Store
// ============================================================================

export const useDocumentsStore = create<DocumentsStore>()((set, get) => ({
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
  // Fetch Documents
  // ========================================================================

  fetchDocuments: async (query) => {
    try {
      set({ isLoading: true, error: null });

      const mergedQuery = { ...get().filters, ...query };
      const response = await documentsService.findAll(mergedQuery);

      set({
        documents: response.data,
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
        totalPages: response.meta.totalPages,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
        documents: [],
        total: 0,
      });
      throw error;
    }
  },

  // ========================================================================
  // Fetch Single Document
  // ========================================================================

  fetchDocument: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const document = await documentsService.findOne(id);

      set({
        currentDocument: document,
        isLoading: false,
        error: null,
      });

      return document;
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
  // Create Document
  // ========================================================================

  createDocument: async (dto) => {
    try {
      set({ isLoading: true, error: null });

      const document = await documentsService.create(dto);

      // Add to local state
      set((state) => ({
        documents: [document, ...state.documents],
        total: state.total + 1,
        isLoading: false,
        error: null,
      }));

      return document;
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
  // Update Document
  // ========================================================================

  updateDocument: async (id, dto) => {
    try {
      set({ isLoading: true, error: null });

      const updated = await documentsService.update(id, dto);

      // Update in local state
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? updated : doc
        ),
        currentDocument:
          state.currentDocument?.id === id ? updated : state.currentDocument,
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
  // Delete Document
  // ========================================================================

  deleteDocument: async (id) => {
    try {
      set({ isLoading: true, error: null });

      await documentsService.remove(id);

      // Remove from local state
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        total: state.total - 1,
        currentDocument:
          state.currentDocument?.id === id ? null : state.currentDocument,
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
  // Bulk Delete Documents
  // ========================================================================

  bulkDeleteDocuments: async (ids) => {
    try {
      set({ isLoading: true, error: null });

      await documentsService.bulkDelete(ids);

      // Remove from local state
      set((state) => ({
        documents: state.documents.filter((doc) => !ids.includes(doc.id)),
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
  // Upload Document
  // ========================================================================

  uploadDocument: async (file, metadata) => {
    try {
      set({ isLoading: true, error: null });

      const document = await documentsService.upload(file, metadata);

      // Add to local state
      set((state) => ({
        documents: [document, ...state.documents],
        total: state.total + 1,
        isLoading: false,
        error: null,
      }));

      return document;
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
  // Generate PDF
  // ========================================================================

  generatePdf: async (id, branding) => {
    try {
      const blob = await documentsService.generatePdf(id, branding);
      return blob;
    } catch (error) {
      console.error(`Failed to generate PDF for document ${id}:`, error);
      throw error;
    }
  },

  // ========================================================================
  // Download PDF
  // ========================================================================

  downloadPdf: async (id, fileName, branding) => {
    try {
      const blob = await documentsService.generatePdf(id, branding);

      if (!blob || blob.size === 0) {
        throw new Error('PDF generation returned empty file');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `document-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to download PDF for document ${id}:`, error);
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

export const selectDocuments = (state: DocumentsStore) => state.documents;
export const selectCurrentDocument = (state: DocumentsStore) => state.currentDocument;
export const selectIsLoading = (state: DocumentsStore) => state.isLoading;
export const selectError = (state: DocumentsStore) => state.error;
export const selectFilters = (state: DocumentsStore) => state.filters;
export const selectPagination = (state: DocumentsStore) => ({
  total: state.total,
  page: state.page,
  limit: state.limit,
  totalPages: state.totalPages,
});
