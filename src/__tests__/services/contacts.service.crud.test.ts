/**
 * Contacts Service - CRUD Operations Test Suite
 * Professional-grade Jest tests for contacts module
 */

import { contactsService } from '@/services/contacts.service';
import type { CreateContactDto, UpdateContactDto, QueryContactsDto } from '@/services/contacts.service';

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

describe('Contacts Service - CRUD Operations', () => {
  const baseContactDto: CreateContactDto = {
    name: 'John Doe',
    phone: '+923001234567',
    email: 'john@example.com',
    type: 'CLIENT',
    category: 'BUYER',
    tenantId: 'tenant-1',
    agencyId: 'agency-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Create', () => {
    const mockCreatedContact = {
      id: 'contact-1',
      ...baseContactDto,
      contactNumber: 'CN-001',
      status: 'ACTIVE',
      isShared: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should create contact and return SchemaContact', async () => {
      mockPost.mockResolvedValue({ data: mockCreatedContact });

      const result = await contactsService.create(baseContactDto);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith('/contacts', baseContactDto);
      expect(result).toEqual(mockCreatedContact);
      expect(result.id).toBe('contact-1');
      expect(result.name).toBe('John Doe');
    });

    it('should throw when create API fails', async () => {
      mockPost.mockRejectedValue(new Error('Validation failed'));

      await expect(contactsService.create(baseContactDto)).rejects.toThrow(
        'Validation failed'
      );
      expect(mockPost).toHaveBeenCalledWith('/contacts', baseContactDto);
    });
  });

  describe('Read - FindAll', () => {
    const mockListResponse = {
      data: [
        {
          id: 'contact-1',
          name: 'John Doe',
          phone: '+923001234567',
          email: 'john@example.com',
          type: 'CLIENT',
          category: 'BUYER',
          status: 'ACTIVE',
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      pages: 1,
    };

    it('should fetch contacts list with default query', async () => {
      mockGet.mockResolvedValue({ data: mockListResponse });

      const result = await contactsService.findAll();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/contacts', { params: {} });
      expect(result).toEqual(mockListResponse);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should fetch contacts with filters and pagination', async () => {
      const query: QueryContactsDto = {
        type: 'CLIENT',
        category: 'BUYER',
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      };
      mockGet.mockResolvedValue({ data: mockListResponse });

      await contactsService.findAll(query);

      expect(mockGet).toHaveBeenCalledWith('/contacts', { params: query });
    });

    it('should throw when findAll API fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(contactsService.findAll()).rejects.toThrow('Network error');
    });
  });

  describe('Read - FindOne', () => {
    const mockContact = {
      id: 'contact-1',
      name: 'John Doe',
      phone: '+923001234567',
      email: 'john@example.com',
      type: 'CLIENT',
      category: 'BUYER',
      status: 'ACTIVE',
      tenantId: 'tenant-1',
      agencyId: 'agency-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should fetch single contact by ID', async () => {
      mockGet.mockResolvedValue({ data: mockContact });

      const result = await contactsService.findOne('contact-1');

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/contacts/contact-1');
      expect(result).toEqual(mockContact);
      expect(result.id).toBe('contact-1');
    });

    it('should throw when findOne API fails (404)', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(contactsService.findOne('non-existent')).rejects.toThrow('Not found');
      expect(mockGet).toHaveBeenCalledWith('/contacts/non-existent');
    });
  });

  describe('Read - FindDetails', () => {
    const mockDetailsResponse = {
      contact: {
        id: 'contact-1',
        name: 'John Doe',
        phone: '+923001234567',
        type: 'CLIENT',
        category: 'BUYER',
      },
      tasks: [{ id: 'task-1', title: 'Follow up', status: 'PENDING' }],
      interactions: [{ id: 'int-1', type: 'CALL', notes: 'Called client' }],
    };

    it('should fetch contact with tasks and interactions', async () => {
      mockGet.mockResolvedValue({ data: mockDetailsResponse });

      const result = await contactsService.findDetails('contact-1');

      expect(mockGet).toHaveBeenCalledWith('/contacts/contact-1/details');
      expect(result).toEqual(mockDetailsResponse);
      expect(result.contact.id).toBe('contact-1');
      expect(result.tasks).toHaveLength(1);
      expect(result.interactions).toHaveLength(1);
    });
  });

  describe('Update', () => {
    const updateDto: UpdateContactDto = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'ACTIVE',
    };

    const mockUpdatedContact = {
      id: 'contact-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+923001234567',
      type: 'CLIENT',
      category: 'BUYER',
      status: 'ACTIVE',
      tenantId: 'tenant-1',
      agencyId: 'agency-1',
      updatedAt: new Date().toISOString(),
    };

    it('should update contact and return updated SchemaContact', async () => {
      mockPut.mockResolvedValue({ data: mockUpdatedContact });

      const result = await contactsService.update('contact-1', updateDto);

      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledWith('/contacts/contact-1', updateDto);
      expect(result).toEqual(mockUpdatedContact);
      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
    });

    it('should throw when update API fails', async () => {
      mockPut.mockRejectedValue(new Error('Update failed'));

      await expect(contactsService.update('contact-1', updateDto)).rejects.toThrow(
        'Update failed'
      );
      expect(mockPut).toHaveBeenCalledWith('/contacts/contact-1', updateDto);
    });
  });

  describe('Delete', () => {
    const mockDeleteResponse = { message: 'Contact deleted', id: 'contact-1' };

    it('should delete contact (soft delete) and return confirmation', async () => {
      mockDelete.mockResolvedValue({ data: mockDeleteResponse });

      const result = await contactsService.remove('contact-1');

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith('/contacts/contact-1');
      expect(result).toEqual(mockDeleteResponse);
      expect(result.id).toBe('contact-1');
    });

    it('should throw when delete API fails', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      await expect(contactsService.remove('contact-1')).rejects.toThrow('Delete failed');
      expect(mockDelete).toHaveBeenCalledWith('/contacts/contact-1');
    });
  });
});
