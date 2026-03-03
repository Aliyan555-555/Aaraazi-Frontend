/**
 * Properties Service - CRUD Operations Test Suite
 * Professional-grade Jest tests for properties module
 */

import { propertiesService } from '@/services/properties.service';
import type {
  CreatePropertyData,
  UpdatePropertyData,
  PropertyQueryParams,
} from '@/lib/api/properties';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe('Properties Service - CRUD Operations', () => {
  const baseCreateData: CreatePropertyData = {
    propertyType: 'HOUSE',
    address: {
      addressType: 'RESIDENTIAL',
      countryId: 'country-1',
      cityId: 'city-1',
      areaId: 'area-1',
      fullAddress: '123 Main St, Karachi',
    },
    area: 2000,
    areaUnit: 'SQFT',
    bedrooms: 3,
    bathrooms: 2,
    tenantId: 'tenant-1',
    agencyId: 'agency-1',
  };

  const mockPropertyListingResponse = {
    id: 'prop-1',
    tenantId: 'tenant-1',
    agencyId: 'agency-1',
    masterPropertyId: 'mp-1',
    title: 'Beautiful House for Sale',
    description: 'Spacious 3-bed house',
    listingType: 'SALE',
    status: 'ACTIVE',
    price: '5000000',
    images: 'https://example.com/img1.jpg',
    masterProperty: {
      id: 'mp-1',
      propertyCode: 'PROP-001',
      type: 'HOUSE',
      area: '2000',
      areaUnit: 'SQFT',
      bedrooms: 3,
      bathrooms: 2,
      address: {
        id: 'addr-1',
        cityId: 'city-1',
        areaId: 'area-1',
        fullAddress: '123 Main St, Karachi',
        city: { id: 'city-1', name: 'Karachi' },
        area: { id: 'area-1', name: 'Clifton' },
        block: null,
      },
    },
    agent: { id: 'agent-1', name: 'Agent Name', email: 'agent@example.com' },
    branch: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Create', () => {
    it('should create property and return PropertyListingApiResponse', async () => {
      mockPost.mockResolvedValue({ data: mockPropertyListingResponse });

      const result = await propertiesService.create(baseCreateData);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith('/properties', baseCreateData);
      expect(result).toEqual(mockPropertyListingResponse);
      expect(result.id).toBe('prop-1');
      expect(result.title).toBe('Beautiful House for Sale');
    });

    it('should throw when create API fails', async () => {
      mockPost.mockRejectedValue(new Error('Validation failed'));

      await expect(propertiesService.create(baseCreateData)).rejects.toThrow(
        'Validation failed'
      );
      expect(mockPost).toHaveBeenCalledWith('/properties', baseCreateData);
    });
  });

  describe('Read - FindAll', () => {
    const mockListResponse = {
      data: [mockPropertyListingResponse],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    it('should fetch properties list with default params', async () => {
      mockGet.mockResolvedValue({ data: mockListResponse });

      const result = await propertiesService.findAll();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/properties', { params: undefined });
      expect(result).toEqual(mockListResponse);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should fetch properties with filters and pagination', async () => {
      const params: PropertyQueryParams = {
        status: 'ACTIVE',
        listingType: 'SALE',
        page: 2,
        limit: 20,
        sortBy: 'price',
        sortOrder: 'desc',
      };
      mockGet.mockResolvedValue({ data: mockListResponse });

      await propertiesService.findAll(params);

      expect(mockGet).toHaveBeenCalledWith('/properties', { params });
    });

    it('should throw when findAll API fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(propertiesService.findAll()).rejects.toThrow('Network error');
    });
  });

  describe('Read - FindOne', () => {
    it('should fetch single property by ID', async () => {
      mockGet.mockResolvedValue({ data: mockPropertyListingResponse });

      const result = await propertiesService.findOne('prop-1');

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/properties/prop-1');
      expect(result).toEqual(mockPropertyListingResponse);
      expect(result.id).toBe('prop-1');
      expect(result.masterProperty.type).toBe('HOUSE');
    });

    it('should throw when findOne API fails', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(propertiesService.findOne('non-existent')).rejects.toThrow(
        'Not found'
      );
      expect(mockGet).toHaveBeenCalledWith('/properties/non-existent');
    });
  });

  describe('Update', () => {
    const updateData: UpdatePropertyData = {
      title: 'Updated Property Title',
      description: 'Updated description',
      price: 5500000,
      status: 'UNDER_OFFER',
    };

    const mockUpdatedResponse = {
      ...mockPropertyListingResponse,
      title: 'Updated Property Title',
      description: 'Updated description',
      price: '5500000',
      status: 'UNDER_OFFER',
      updatedAt: new Date().toISOString(),
    };

    it('should update property and return updated response', async () => {
      mockPut.mockResolvedValue({ data: mockUpdatedResponse });

      const result = await propertiesService.update('prop-1', updateData);

      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledWith('/properties/prop-1', updateData);
      expect(result).toEqual(mockUpdatedResponse);
      expect(result.title).toBe('Updated Property Title');
      expect(result.price).toBe('5500000');
    });

    it('should throw when update API fails', async () => {
      mockPut.mockRejectedValue(new Error('Update failed'));

      await expect(propertiesService.update('prop-1', updateData)).rejects.toThrow(
        'Update failed'
      );
      expect(mockPut).toHaveBeenCalledWith('/properties/prop-1', updateData);
    });
  });

  describe('Delete', () => {
    const mockDeleteResponse = { message: 'Property deleted', id: 'prop-1' };

    it('should delete property (soft delete) and return confirmation', async () => {
      mockDelete.mockResolvedValue({ data: mockDeleteResponse });

      const result = await propertiesService.remove('prop-1');

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith('/properties/prop-1');
      expect(result).toEqual(mockDeleteResponse);
      expect(result.id).toBe('prop-1');
    });

    it('should throw when delete API fails', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      await expect(propertiesService.remove('prop-1')).rejects.toThrow('Delete failed');
      expect(mockDelete).toHaveBeenCalledWith('/properties/prop-1');
    });
  });
});
