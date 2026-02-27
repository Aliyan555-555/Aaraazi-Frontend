/**
 * Documents Service Layer
 * Professional-grade documents service with error handling
 */

import { apiClient } from '@/lib/api/client';
import type {
  DocumentType,
  DocumentDetails,
  DocumentClause,
  GeneratedDocument,
} from '@/types/documents';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateDocumentDto {
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

export interface UpdateDocumentDto {
  documentName?: string;
  status?: string;
  details?: DocumentDetails;
  clauses?: DocumentClause[];
  pdfUrl?: string;
  fileSize?: number;
}

export interface QueryDocumentsDto {
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

export interface GeneratePdfBrandingDto {
  portalTitle?: string;
  agencyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  footerText?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface UploadDocumentDto {
  documentName: string;
  documentType: string;
  propertyId?: string;
  transactionId?: string;
  contactId?: string;
  agencyId: string;
  tenantId: string;
}

// ============================================================================
// Type Mapping Helpers
// ============================================================================

const DOC_TYPE_TO_BACKEND: Record<string, string> = {
  'sales-agreement': 'SALES_AGREEMENT',
  'final-sale-deed': 'FINAL_SALE_DEED',
  'rental-agreement': 'RENTAL_AGREEMENT',
  'property-disclosure': 'PROPERTY_DISCLOSURE',
  'payment-receipt': 'PAYMENT_RECEIPT',
};

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

// ============================================================================
// Documents Service Class
// ============================================================================

class DocumentsService {
  private readonly baseUrl = '/documents';

  /**
   * Create a new document
   */
  async create(dto: CreateDocumentDto): Promise<GeneratedDocument> {
    try {
      const body = {
        ...dto,
        documentType: toBackendDocumentType(dto.documentType),
      };
      const response = await apiClient.post<Record<string, unknown>>(
        this.baseUrl,
        body
      );
      return fromBackendDocument(response.data);
    } catch (error) {
      console.error('Failed to create document:', error);
      throw error;
    }
  }

  /**
   * Get all documents with pagination and filters
   */
  async findAll(query: QueryDocumentsDto = {}): Promise<DocumentsListResponse> {
    try {
      const response = await apiClient.get<{
        data: Record<string, unknown>[];
        meta: DocumentsListResponse['meta'];
      }>(this.baseUrl, { params: query });

      return {
        data: response.data.data.map(fromBackendDocument),
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    }
  }

  /**
   * Get a single document by ID
   */
  async findOne(id: string): Promise<GeneratedDocument> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `${this.baseUrl}/${id}`
      );
      return fromBackendDocument(response.data);
    } catch (error) {
      console.error(`Failed to fetch document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async update(id: string, dto: UpdateDocumentDto): Promise<GeneratedDocument> {
    try {
      const response = await apiClient.patch<Record<string, unknown>>(
        `${this.baseUrl}/${id}`,
        dto
      );
      return fromBackendDocument(response.data);
    } catch (error) {
      console.error(`Failed to update document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    try {
      const response = await apiClient.delete<{ message: string; id: string }>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to delete document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Generate PDF for a document with white-label branding
   */
  async generatePdf(
    id: string,
    branding?: GeneratePdfBrandingDto
  ): Promise<Blob> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/${id}/generate-pdf`,
        { branding },
        { responseType: 'blob', validateStatus: () => true }
      );

      // Check if response is error
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
    } catch (error) {
      console.error(`Failed to generate PDF for document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Upload an external document file
   */
  async upload(file: File, metadata: UploadDocumentDto): Promise<GeneratedDocument> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentName', metadata.documentName);
      formData.append('documentType', toBackendDocumentType(metadata.documentType));
      formData.append('agencyId', metadata.agencyId);
      formData.append('tenantId', metadata.tenantId);

      if (metadata.propertyId) formData.append('propertyId', metadata.propertyId);
      if (metadata.transactionId)
        formData.append('transactionId', metadata.transactionId);
      if (metadata.contactId) formData.append('contactId', metadata.contactId);

      const response = await apiClient.post<Record<string, unknown>>(
        `${this.baseUrl}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return fromBackendDocument(response.data);
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  }

  /**
   * Get documents by property
   */
  async findByProperty(propertyId: string): Promise<GeneratedDocument[]> {
    try {
      const response = await apiClient.get<GeneratedDocument[]>(
        `${this.baseUrl}/property/${propertyId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch documents for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Get documents by contact
   */
  async findByContact(contactId: string): Promise<GeneratedDocument[]> {
    try {
      const response = await apiClient.get<GeneratedDocument[]>(
        `${this.baseUrl}/contact/${contactId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch documents for contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Batch delete documents
   */
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      const promises = ids.map((id) => this.remove(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk delete documents:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const documentsService = new DocumentsService();
export default documentsService;
