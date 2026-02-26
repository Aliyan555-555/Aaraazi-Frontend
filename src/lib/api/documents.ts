/**
 * Documents API – create, list, generate PDF (white-label), delete
 */

import apiClient from './client';
import type {
  DocumentType,
  DocumentDetails,
  DocumentClause,
  GeneratedDocument,
} from '@/types/documents';

const BASE = '/documents';

/** Map frontend document type to backend enum */
const DOC_TYPE_TO_BACKEND: Record<string, string> = {
  'sales-agreement': 'SALES_AGREEMENT',
  'final-sale-deed': 'FINAL_SALE_DEED',
  'rental-agreement': 'RENTAL_AGREEMENT',
  'property-disclosure': 'PROPERTY_DISCLOSURE',
  'payment-receipt': 'PAYMENT_RECEIPT',
};

/** Map backend enum to frontend document type */
const DOC_TYPE_FROM_BACKEND: Record<string, DocumentType> = {
  SALES_AGREEMENT: 'sales-agreement',
  FINAL_SALE_DEED: 'final-sale-deed',
  RENTAL_AGREEMENT: 'rental-agreement',
  PROPERTY_DISCLOSURE: 'property-disclosure',
  PAYMENT_RECEIPT: 'payment-receipt',
  PAYMENT_SCHEDULE: 'payment-receipt',
  OFFER_LETTER: 'sales-agreement',
  LISTING_AGREEMENT: 'sales-agreement',
  BUYER_REPRESENTATION: 'sales-agreement',
  PROPERTY_BROCHURE: 'property-disclosure',
  CUSTOM: 'sales-agreement',
};

function toBackendDocumentType(type: string): string {
  return DOC_TYPE_TO_BACKEND[type] || type;
}

function fromBackendDocument(doc: Record<string, unknown>): GeneratedDocument {
  const documentType =
    DOC_TYPE_FROM_BACKEND[doc.documentType as string] ||
    (doc.documentType as DocumentType);
  return {
    ...doc,
    documentType,
    details: (doc.details as DocumentDetails) || {},
    clauses: (doc.clauses as DocumentClause[]) || [],
  } as GeneratedDocument;
}

export interface CreateDocumentPayload {
  documentType: string;
  documentName: string;
  details: DocumentDetails;
  clauses: DocumentClause[];
  propertyId?: string;
  transactionId?: string;
  contactId?: string;
  agencyId: string;
  tenantId: string;
}

export interface QueryDocumentsParams {
  agencyId?: string;
  tenantId?: string;
  propertyId?: string;
  transactionId?: string;
  contactId?: string;
  documentType?: string;
  status?: string;
  createdBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DocumentsListResponse {
  data: GeneratedDocument[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GeneratePdfBranding {
  portalTitle?: string;
  agencyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  footerText?: string;
  supportEmail?: string;
  supportPhone?: string;
}

/**
 * Create a document (saved on backend)
 */
export async function createDocument(
  payload: CreateDocumentPayload
): Promise<GeneratedDocument> {
  const body = {
    ...payload,
    documentType: toBackendDocumentType(payload.documentType),
  };
  const { data } = await apiClient.post<Record<string, unknown>>(BASE, body);
  return fromBackendDocument(data);
}

/**
 * List documents with optional filters
 */
export async function listDocuments(
  params?: QueryDocumentsParams
): Promise<DocumentsListResponse> {
  const { data } = await apiClient.get<{ data: Record<string, unknown>[]; meta: DocumentsListResponse['meta'] }>(BASE, {
    params,
  });
  return {
    data: data.data.map(fromBackendDocument),
    meta: data.meta,
  };
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<GeneratedDocument> {
  const { data } = await apiClient.get<Record<string, unknown>>(`${BASE}/${id}`);
  return fromBackendDocument(data);
}

/**
 * Update a document
 */
export async function updateDocument(
  id: string,
  payload: Partial<{
    documentName: string;
    status: string;
    details: DocumentDetails;
    clauses: DocumentClause[];
    pdfUrl: string;
    fileSize: number;
  }>
): Promise<GeneratedDocument> {
  const { data } = await apiClient.patch<Record<string, unknown>>(`${BASE}/${id}`, payload);
  return fromBackendDocument(data);
}

/**
 * Generate PDF for a document (white-label); returns blob for download.
 * Handles error responses: when backend returns 4xx/5xx with JSON body, the response
 * is still a blob, so we check status and throw with server message if not OK.
 */
export async function generateDocumentPdf(
  id: string,
  branding?: GeneratePdfBranding
): Promise<Blob> {
  const response = await apiClient.post(
    `${BASE}/${id}/generate-pdf`,
    { branding },
    { responseType: 'blob', validateStatus: () => true }
  );

  if (response.status < 200 || response.status >= 300) {
    let message = `PDF generation failed (${response.status})`;
    try {
      const text = await (response.data as Blob).text();
      const json = JSON.parse(text);
      if (Array.isArray(json.message)) {
        message = json.message.join(', ');
      } else if (typeof json.message === 'string') {
        message = json.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.data as Blob;
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<{ message: string; id: string }> {
  const { data } = await apiClient.delete<{ message: string; id: string }>(`${BASE}/${id}`);
  return data;
}

/**
 * Get documents by property
 */
export async function getDocumentsByProperty(
  propertyId: string
): Promise<GeneratedDocument[]> {
  const { data } = await apiClient.get<GeneratedDocument[]>(
    `${BASE}/property/${propertyId}`
  );
  return data;
}

/**
 * Get documents by contact
 */
export async function getDocumentsByContact(
  contactId: string
): Promise<GeneratedDocument[]> {
  const { data } = await apiClient.get<GeneratedDocument[]>(
    `${BASE}/contact/${contactId}`
  );
  return data;
}

/**
 * Upload an external document file (PDF, image, etc.)
 */
export async function uploadDocument(
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
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentName', metadata.documentName);
  formData.append('documentType', toBackendDocumentType(metadata.documentType));
  formData.append('agencyId', metadata.agencyId);
  formData.append('tenantId', metadata.tenantId);
  
  if (metadata.propertyId) formData.append('propertyId', metadata.propertyId);
  if (metadata.transactionId) formData.append('transactionId', metadata.transactionId);
  if (metadata.contactId) formData.append('contactId', metadata.contactId);

  const { data } = await apiClient.post<Record<string, unknown>>(
    `${BASE}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return fromBackendDocument(data);
}
