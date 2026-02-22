/**
 * Documents module – API hooks and re-exports
 * Use these instead of lib/api/documents in components
 */

export { useDocumentsApi } from './hooks/useDocumentsApi';
export { documentsService } from '@/services/documents.service';
export type {
  CreateDocumentPayload,
  QueryDocumentsParams,
  DocumentsListResponse,
  GeneratePdfBranding,
} from '@/services/documents.service';
