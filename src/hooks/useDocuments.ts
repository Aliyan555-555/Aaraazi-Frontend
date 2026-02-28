"use client";

import { useEffect, useCallback } from "react";
import { useDocumentsStore } from "@/store/useDocumentsStore";
import type {
  CreateDocumentDto,
  UpdateDocumentDto,
  QueryDocumentsDto,
  GeneratePdfBrandingDto,
  UploadDocumentDto,
} from "@/services/documents.service";
import { toast } from "sonner";

export function useDocuments(query?: QueryDocumentsDto) {
  const {
    documents,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    isInitialized,
    error,
    filters,
    fetchDocuments,
    setFilters,
    clearFilters,
    clearError,
  } = useDocumentsStore();

  // Auto-fetch on mount or when query changes
  useEffect(() => {
    if (query) {
      setFilters(query);
    }
    fetchDocuments(query);
  }, [
    query?.agencyId,
    query?.tenantId,
    query?.propertyId,
    query?.contactId,
    query?.documentType,
    query?.status,
    query?.page,
    query?.limit,
  ]);

  const refetch = useCallback(() => {
    fetchDocuments(query);
  }, [fetchDocuments, query]);

  return {
    documents,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    isInitialized,
    error,
    filters,
    refetch,
    setFilters,
    clearFilters,
    clearError,
  };
}

// ============================================================================
// useDocument Hook - Single document
// ============================================================================

export function useDocument(id: string) {
  const { currentDocument, isLoading, error, fetchDocument, clearError } =
    useDocumentsStore();

  useEffect(() => {
    if (id) {
      fetchDocument(id);
    }
  }, [id]);

  return {
    document: currentDocument,
    isLoading,
    error,
    refetch: () => fetchDocument(id),
    clearError,
  };
}

// ============================================================================
// useCreateDocument Hook
// ============================================================================

export function useCreateDocument() {
  const { createDocument, isLoading, error } = useDocumentsStore();

  const create = useCallback(
    async (dto: CreateDocumentDto) => {
      try {
        const document = await createDocument(dto);
        toast.success("Document created successfully");
        return document;
      } catch (err) {
        console.error("Failed to create document:", err);
        toast.error("Failed to create document");
        throw err;
      }
    },
    [createDocument],
  );

  return {
    createDocument: create,
    isLoading,
    error,
  };
}

// ============================================================================
// useUpdateDocument Hook
// ============================================================================

export function useUpdateDocument() {
  const { updateDocument, isLoading, error } = useDocumentsStore();

  const update = useCallback(
    async (id: string, dto: UpdateDocumentDto) => {
      try {
        const document = await updateDocument(id, dto);
        toast.success("Document updated successfully");
        return document;
      } catch (err) {
        console.error("Failed to update document:", err);
        toast.error("Failed to update document");
        throw err;
      }
    },
    [updateDocument],
  );

  return {
    updateDocument: update,
    isLoading,
    error,
  };
}

// ============================================================================
// useDeleteDocument Hook
// ============================================================================

export function useDeleteDocument() {
  const { deleteDocument, isLoading, error } = useDocumentsStore();

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteDocument(id);
        toast.success("Document deleted successfully");
      } catch (err) {
        console.error("Failed to delete document:", err);
        toast.error("Failed to delete document");
        throw err;
      }
    },
    [deleteDocument],
  );

  return {
    deleteDocument: remove,
    isLoading,
    error,
  };
}

// ============================================================================
// useBulkDeleteDocuments Hook
// ============================================================================

export function useBulkDeleteDocuments() {
  const { bulkDeleteDocuments, isLoading, error } = useDocumentsStore();

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      try {
        await bulkDeleteDocuments(ids);
        toast.success(`${ids.length} document(s) deleted successfully`);
      } catch (err) {
        console.error("Failed to bulk delete documents:", err);
        toast.error("Failed to delete documents");
        throw err;
      }
    },
    [bulkDeleteDocuments],
  );

  return {
    bulkDeleteDocuments: bulkDelete,
    isLoading,
    error,
  };
}

// ============================================================================
// useUploadDocument Hook
// ============================================================================

export function useUploadDocument() {
  const { uploadDocument, isLoading, error } = useDocumentsStore();

  const upload = useCallback(
    async (file: File, metadata: UploadDocumentDto) => {
      try {
        const document = await uploadDocument(file, metadata);
        toast.success("Document uploaded successfully");
        return document;
      } catch (err) {
        console.error("Failed to upload document:", err);
        toast.error("Failed to upload document");
        throw err;
      }
    },
    [uploadDocument],
  );

  return {
    uploadDocument: upload,
    isLoading,
    error,
  };
}

// ============================================================================
// useDownloadPdf Hook
// ============================================================================

export function useDownloadPdf() {
  const { downloadPdf } = useDocumentsStore();
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const download = useCallback(
    async (
      id: string,
      fileName?: string,
      branding?: GeneratePdfBrandingDto,
    ) => {
      try {
        setDownloadingId(id);
        await downloadPdf(id, fileName, branding);
        toast.success("PDF downloaded successfully");
      } catch (err) {
        console.error("Failed to download PDF:", err);
        const message =
          err instanceof Error ? err.message : "Failed to download PDF";
        toast.error(message);
        throw err;
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadPdf],
  );

  return {
    downloadPdf: download,
    isDownloading: !!downloadingId,
    downloadingId,
  };
}

// Fix missing React import
import React from "react";

// ============================================================================
// useGeneratePdf Hook
// ============================================================================

export function useGeneratePdf() {
  const { generatePdf } = useDocumentsStore();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generate = useCallback(
    async (id: string, branding?: GeneratePdfBrandingDto) => {
      try {
        setIsGenerating(true);
        const blob = await generatePdf(id, branding);
        return blob;
      } catch (err) {
        console.error("Failed to generate PDF:", err);
        toast.error("Failed to generate PDF");
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePdf],
  );

  return {
    generatePdf: generate,
    isGenerating,
  };
}

// ============================================================================
// useDocumentsByProperty Hook
// ============================================================================

export function useDocumentsByProperty(propertyId: string) {
  return useDocuments({
    propertyId,
  });
}

// ============================================================================
// useDocumentsByContact Hook
// ============================================================================

export function useDocumentsByContact(contactId: string) {
  return useDocuments({
    contactId,
  });
}
