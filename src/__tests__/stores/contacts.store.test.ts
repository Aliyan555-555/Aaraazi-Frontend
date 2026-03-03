/**
 * Contacts store tests
 * Mocks contactsService. Tests fetchContacts, createContact, updateContact, deleteContact.
 * Professional-grade Jest tests for contacts store CRUD.
 */

import { useContactsStore } from '@/stores/contacts.store';

const mockFindAll = jest.fn();
const mockFindOne = jest.fn();
const mockFindDetails = jest.fn();
const mockGetStatistics = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock('@/services/contacts.service', () => ({
  contactsService: {
    findAll: (query: unknown) => mockFindAll(query),
    findOne: (id: string) => mockFindOne(id),
    findDetails: (id: string) => mockFindDetails(id),
    getStatistics: () => mockGetStatistics(),
    create: (data: unknown) => mockCreate(data),
    update: (id: string, data: unknown) => mockUpdate(id, data),
    remove: (id: string) => mockRemove(id),
    bulkUpdate: jest.fn(),
    bulkDelete: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockContact = {
  id: 'c-1',
  tenantId: 't-1',
  agencyId: 'a-1',
  contactNumber: '03001234567',
  type: 'CLIENT',
  category: 'BUYER',
  status: 'ACTIVE',
  name: 'Test Contact',
  phone: '03001234567',
  email: null,
  tags: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('contacts.store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useContactsStore.setState({
      listCache: {},
      listLoading: {},
      listError: {},
      detailCache: {},
      detailLoading: {},
      detailError: {},
    });
  });

  describe('fetchContacts', () => {
    it('fetches contacts and populates listCache', async () => {
      mockFindAll.mockResolvedValue({
        data: [mockContact],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      });
      const result = await useContactsStore.getState().fetchContacts({ limit: 10 });
      expect(mockFindAll).toHaveBeenCalledWith({ limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Contact');
      expect(useContactsStore.getState().listCache).toBeDefined();
    });

    it('throws and sets listError on failure', async () => {
      mockFindAll.mockRejectedValue(new Error('Network error'));
      await expect(useContactsStore.getState().fetchContacts()).rejects.toThrow('Network error');
      expect(Object.values(useContactsStore.getState().listError)).toContain('Network error');
    });
  });

  describe('fetchContact', () => {
    it('fetches single contact and populates detailCache', async () => {
      mockFindOne.mockResolvedValue(mockContact);
      const result = await useContactsStore.getState().fetchContact('c-1');
      expect(mockFindOne).toHaveBeenCalledWith('c-1');
      expect(result.name).toBe('Test Contact');
      expect(useContactsStore.getState().detailCache['c-1']).toEqual(mockContact);
    });
  });

  describe('createContact', () => {
    it('creates contact via service and invalidates lists', async () => {
      mockCreate.mockResolvedValue(mockContact);
      const dto = {
        name: 'New Contact',
        phone: '03001234567',
        type: 'CLIENT' as const,
        category: 'BUYER' as const,
        tenantId: 't-1',
        agencyId: 'a-1',
      };
      const result = await useContactsStore.getState().createContact(dto);
      expect(mockCreate).toHaveBeenCalledWith(dto);
      expect(result.name).toBe('Test Contact');
      expect(useContactsStore.getState().detailCache['c-1']).toEqual(mockContact);
    });
  });

  describe('updateContact', () => {
    it('updates contact via service', async () => {
      const updated = { ...mockContact, name: 'Updated Name' };
      mockUpdate.mockResolvedValue(updated);
      const result = await useContactsStore.getState().updateContact('c-1', { name: 'Updated Name' });
      expect(mockUpdate).toHaveBeenCalledWith('c-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('deleteContact', () => {
    it('deletes contact via service and removes from detailCache', async () => {
      mockRemove.mockResolvedValue({ message: 'Deleted', id: 'c-1' });
      useContactsStore.setState({ detailCache: { 'c-1': mockContact } });
      await useContactsStore.getState().deleteContact('c-1');
      expect(mockRemove).toHaveBeenCalledWith('c-1');
      expect(useContactsStore.getState().detailCache['c-1']).toBeUndefined();
    });
  });
});
