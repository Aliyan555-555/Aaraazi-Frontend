/**
 * Documents Service - CRUD Operations Test Suite
 * Professional-grade Jest tests for documents module
 */

import { documentsService } from '@/services/documents.service';
import type {
  CreateDocumentDto,
  UpdateDocumentDto,
  QueryDocumentsDto,
} from '@/services/documents.service';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe('Documents Service - CRUD Operations', () => {
  const baseCreateDto: CreateDocumentDto = {
    documentType: 'sales-agreement',
    documentName: 'Sales Agreement - Property 123',
    details: {
      sellerName: 'Ali Khan',
      buyerName: 'Sara Ahmed',
      propertyAddress: '123 Main St, Karachi',
      salePrice: 5000000,
    },
    clauses: [
      { id: '1', title: 'Parties', content: '...', isCustom: false, order: 1 },
    ],
    agencyId: 'agency-1',
    tenantId: 'tenant-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Create', () => {
    const mockCreatedDocument = {
      id: 'doc-1',
      documentType: 'SALES_AGREEMENT',
      documentName: 'Sales Agreement - Property 123',
      details: baseCreateDto.details,
      clauses: baseCreateDto.clauses,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      createdBy: 'user-1',
    };

    it('should create document and return GeneratedDocument', async () => {
      mockPost.mockResolvedValue({ data: mockCreatedDocument });

      const result = await documentsService.create(baseCreateDto);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith('/documents', expect.objectContaining({
        documentType: 'SALES_AGREEMENT',
        documentName: baseCreateDto.documentName,
        details: baseCreateDto.details,
        clauses: baseCreateDto.clauses,
        agencyId: baseCreateDto.agencyId,
        tenantId: baseCreateDto.tenantId,
      }));
      expect(result).toBeDefined();
      expect(result.id).toBe('doc-1');
      expect(result.documentName).toBe('Sales Agreement - Property 123');
    });

    it('should map frontend document type to backend enum', async () => {
      mockPost.mockResolvedValue({ data: { ...mockCreatedDocument, documentType: 'RENTAL_AGREEMENT' } });

      await documentsService.create({
        ...baseCreateDto,
        documentType: 'rental-agreement',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/documents',
        expect.objectContaining({ documentType: 'RENTAL_AGREEMENT' })
      );
    });

    it('should throw when create API fails', async () => {
      mockPost.mockRejectedValue(new Error('Validation failed'));

      await expect(documentsService.create(baseCreateDto)).rejects.toThrow(
        'Validation failed'
      );
    });
  });

  describe('Read - FindAll', () => {
    const mockListResponse = {
      data: [
        {
          id: 'doc-1',
          documentType: 'SALES_AGREEMENT',
          documentName: 'Sales Agreement',
          details: {},
          clauses: [],
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          createdBy: 'user-1',
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    it('should fetch documents list with default query', async () => {
      mockGet.mockResolvedValue({ data: mockListResponse });

      const result = await documentsService.findAll();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/documents', { params: {} });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual(mockListResponse.meta);
      expect(result.data[0].id).toBe('doc-1');
      expect(result.data[0].documentName).toBe('Sales Agreement');
      expect(result.data[0].documentType).toBe('sales-agreement');
    });

    it('should fetch documents with filters and pagination', async () => {
      const query: QueryDocumentsDto = {
        agencyId: 'agency-1',
        propertyId: 'prop-1',
        documentType: 'sales-agreement',
        page: 1,
        limit: 20,
      };
      mockGet.mockResolvedValue({ data: mockListResponse });

      await documentsService.findAll(query);

      expect(mockGet).toHaveBeenCalledWith('/documents', { params: query });
    });

    it('should throw when findAll API fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(documentsService.findAll()).rejects.toThrow('Network error');
    });
  });

  describe('Read - FindOne', () => {
    const mockDocument = {
      id: 'doc-1',
      documentType: 'SALES_AGREEMENT',
      documentName: 'Sales Agreement - Property 123',
      details: { sellerName: 'Ali', buyerName: 'Sara' },
      clauses: [{ id: '1', title: 'Parties', content: '...', isCustom: false, order: 1 }],
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      createdBy: 'user-1',
    };

    it('should fetch single document by ID', async () => {
      mockGet.mockResolvedValue({ data: mockDocument });

      const result = await documentsService.findOne('doc-1');

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/documents/doc-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('doc-1');
      expect(result.documentName).toBe('Sales Agreement - Property 123');
    });

    it('should throw when findOne API fails', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(documentsService.findOne('non-existent')).rejects.toThrow('Not found');
      expect(mockGet).toHaveBeenCalledWith('/documents/non-existent');
    });
  });

  describe('Update', () => {
    const updateDto: UpdateDocumentDto = {
      documentName: 'Updated Sales Agreement',
      status: 'FINALIZED',
      details: { salePrice: 5500000 },
    };

    const mockUpdatedDocument = {
      id: 'doc-1',
      documentType: 'SALES_AGREEMENT',
      documentName: 'Updated Sales Agreement',
      details: { salePrice: 5500000 },
      clauses: [],
      status: 'FINALIZED',
      updatedAt: new Date().toISOString(),
    };

    it('should update document and return updated GeneratedDocument', async () => {
      mockPatch.mockResolvedValue({ data: mockUpdatedDocument });

      const result = await documentsService.update('doc-1', updateDto);

      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledWith('/documents/doc-1', updateDto);
      expect(result).toBeDefined();
      expect(result.documentName).toBe('Updated Sales Agreement');
      expect(result.status).toBe('FINALIZED');
    });

    it('should throw when update API fails', async () => {
      mockPatch.mockRejectedValue(new Error('Update failed'));

      await expect(documentsService.update('doc-1', updateDto)).rejects.toThrow(
        'Update failed'
      );
      expect(mockPatch).toHaveBeenCalledWith('/documents/doc-1', updateDto);
    });
  });

  describe('Delete', () => {
    const mockDeleteResponse = { message: 'Document deleted', id: 'doc-1' };

    it('should delete document and return confirmation', async () => {
      mockDelete.mockResolvedValue({ data: mockDeleteResponse });

      const result = await documentsService.remove('doc-1');

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith('/documents/doc-1');
      expect(result).toEqual(mockDeleteResponse);
      expect(result.id).toBe('doc-1');
    });

    it('should throw when delete API fails', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      await expect(documentsService.remove('doc-1')).rejects.toThrow('Delete failed');
      expect(mockDelete).toHaveBeenCalledWith('/documents/doc-1');
    });
  });
});
