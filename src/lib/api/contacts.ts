/**
 * Contacts API Client
 * Handles all contact-related API calls
 */

import { apiClient } from './client';
import type { ContactType, ContactCategory, ContactStatus } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export interface Contact {
  id: string;
  contactNumber: string;
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  type: ContactType;
  category: ContactCategory;
  status: ContactStatus;
  preferences?: any;
  tags?: string;
  isShared: boolean;
  tenantId: string;
  agencyId: string;
  branchId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  name: string;
  phone: string;
  email?: string;
  cnic?: string;
  alternatePhone?: string;
  address?: string;
  type: ContactType;
  category: ContactCategory;
  status?: ContactStatus;
  tenantId: string;
  agencyId: string;
  branchId?: string;
  agentId?: string;
  preferences?: string;
  tags?: string;
  isShared?: boolean;
}

export interface UpdateContactData {
  name?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  type?: ContactType;
  category?: ContactCategory;
  status?: ContactStatus;
  preferences?: string;
  tags?: string;
  isShared?: boolean;
}

export interface ContactSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ContactType;
  category?: ContactCategory;
  status?: ContactStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactListResponse {
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContactStatistics {
  total: number;
  clients: number;
  prospects: number;
  buyers: number;
  sellers: number;
  landlords: number;
  tenants: number;
}

// ============================================================================
// API Methods
// ============================================================================

export const contactsApi = {
  /**
   * Search/list contacts with filters
   */
  search: async (query?: string, params?: ContactSearchParams): Promise<ContactListResponse> => {
    const searchParams = {
      ...params,
      search: query,
    };
    const response = await apiClient.get('/contacts', { params: searchParams });
    return response.data;
  },

  /**
   * List all contacts (alias for search without query)
   */
  list: async (params?: ContactSearchParams): Promise<ContactListResponse> => {
    const response = await apiClient.get('/contacts', { params });
    return response.data;
  },

  /**
   * Get contact by ID
   */
  getById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data;
  },

  /**
   * Create a new contact
   */
  create: async (data: CreateContactData): Promise<Contact> => {
    const response = await apiClient.post('/contacts', data);
    return response.data;
  },

  /**
   * Update contact
   */
  update: async (id: string, data: UpdateContactData): Promise<Contact> => {
    const response = await apiClient.put(`/contacts/${id}`, data);
    return response.data;
  },

  /**
   * Delete contact (soft delete)
   */
  delete: async (id: string) => {
    const response = await apiClient.delete(`/contacts/${id}`);
    return response.data;
  },

  /**
   * Get contact statistics
   */
  statistics: async (): Promise<ContactStatistics> => {
    const response = await apiClient.get('/contacts/statistics');
    return response.data;
  },
};

export default contactsApi;
