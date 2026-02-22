import {
  listDocuments as listDocumentsApi,
  createDocument as createDocumentApi,
  uploadDocument as uploadDocumentApi,
  deleteDocument as deleteDocumentApi,
  generateDocumentPdf as generateDocumentPdfApi,
  getDocument as getDocumentApi,
  updateDocument as updateDocumentApi,
  getDocumentsByProperty as getDocumentsByPropertyApi,
  getDocumentsByContact as getDocumentsByContactApi,
  type CreateDocumentPayload,
  type QueryDocumentsParams,
  type DocumentsListResponse,
  type GeneratePdfBranding,
} from '@/lib/api/documents';
import type { GeneratedDocument } from '@/types/documents';

export type {
  CreateDocumentPayload,
  QueryDocumentsParams,
  DocumentsListResponse,
  GeneratePdfBranding,
} from '@/lib/api/documents';

class DocumentsService {
  async list(params?: QueryDocumentsParams): Promise<DocumentsListResponse> {
    return listDocumentsApi(params);
  }

  async create(payload: CreateDocumentPayload): Promise<GeneratedDocument> {
    return createDocumentApi(payload);
  }

  async upload(
    file: File,
    metadata: {
      documentName: string;
      documentType: string;
      propertyId?: string;
      transactionId?: string;
      contactId?: string;
      agencyId: string;
      tenantId: string;
    }
  ): Promise<GeneratedDocument> {
    return uploadDocumentApi(file, metadata);
  }

  async remove(id: string): Promise<{ message: string; id: string }> {
    return deleteDocumentApi(id);
  }

  async generatePdf(id: string, branding?: GeneratePdfBranding): Promise<Blob> {
    return generateDocumentPdfApi(id, branding);
  }

  async get(id: string): Promise<GeneratedDocument> {
    return getDocumentApi(id);
  }

  async update(
    id: string,
    payload: Parameters<typeof updateDocumentApi>[1]
  ): Promise<GeneratedDocument> {
    return updateDocumentApi(id, payload);
  }

  async getByProperty(propertyId: string): Promise<GeneratedDocument[]> {
    return getDocumentsByPropertyApi(propertyId);
  }

  async getByContact(contactId: string): Promise<GeneratedDocument[]> {
    return getDocumentsByContactApi(contactId);
  }
}

export const documentsService = new DocumentsService();
