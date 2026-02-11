/**
 * useDocumentsApi – fetch documents from backend (when authenticated)
 */

import { useState, useCallback, useEffect } from 'react';
import {
  listDocuments,
  generateDocumentPdf,
  deleteDocument,
  type QueryDocumentsParams,
  type DocumentsListResponse,
} from '@/lib/api/documents';
import type { GeneratedDocument } from '@/types/documents';

export function useDocumentsApi(params?: QueryDocumentsParams) {
  const [data, setData] = useState<DocumentsListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agencyId = params?.agencyId;
  const tenantId = params?.tenantId;
  const page = params?.page;
  const limit = params?.limit;

  const fetchDocuments = useCallback(async () => {
    if (!agencyId && !tenantId) {
      setData({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      setLoading(false);
      setError(null);
      return { data: [], meta: { total: 0, page: 1, limit: limit ?? 20, totalPages: 0 } };
    }
    setLoading(true);
    setError(null);
    try {
      const result = await listDocuments(params);
      setData(result);
      return result;
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load documents';
      setError(message);
      setData({ data: [], meta: { total: 0, page: 1, limit: limit ?? 20, totalPages: 0 } });
      return null;
    } finally {
      setLoading(false);
    }
  }, [agencyId, tenantId, page, limit]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const downloadPdf = useCallback(
    async (documentId: string, fileName?: string): Promise<boolean> => {
      try {
        const blob = await generateDocumentPdf(documentId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `document-${documentId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
      } catch (e) {
        console.error('PDF download failed', e);
        return false;
      }
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    try {
      await deleteDocument(id);
      await fetchDocuments();
      return true;
    } catch {
      return false;
    }
  }, [fetchDocuments]);

  return {
    documents: data?.data ?? [],
    meta: data?.meta,
    loading,
    error,
    refetch: fetchDocuments,
    downloadPdf,
    remove,
  };
}
