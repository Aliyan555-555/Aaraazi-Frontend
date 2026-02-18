/**
 * Professional Contacts API Service
 * Type-safe API client for contact operations
 */

import { apiClient } from '@/lib/api/client';
import type { Contact as SchemaContact } from '@/types/schema';
import {
  ContactType,
  ContactCategory,
  ContactStatus,
} from '@/types/schema';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateContactDto {
  name: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  type: ContactType;
  category: ContactCategory;
  status?: ContactStatus;
  tenantId: string;
  agencyId: string;
  branchId?: string;
  agentId?: string;
  preferences?: string; // JSON string
  tags?: string; // Comma-separated
  isShared?: boolean;
  originLeadId?: string;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {
  status?: ContactStatus;
}

export interface QueryContactsDto {
  type?: ContactType;
  category?: ContactCategory;
  status?: ContactStatus;
  agentId?: string;
  search?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactsListResponse {
  data: SchemaContact[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ContactStatistics {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  recentContacts: number;
}

// ============================================================================
// Contacts Service
// ============================================================================

class ContactsService {
  private readonly baseUrl = '/contacts';

  /**
   * Create a new contact
   */
  async create(dto: CreateContactDto): Promise<SchemaContact> {
    try {
      const response = await apiClient.post<SchemaContact>(this.baseUrl, dto);
      return response.data;
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }

  /**
   * Get all contacts with pagination and filters
   */
  async findAll(query: QueryContactsDto = {}): Promise<ContactsListResponse> {
    try {
      const response = await apiClient.get<ContactsListResponse>(
        this.baseUrl,
        { params: query },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      throw error;
    }
  }

  /**
   * Get a single contact by ID
   */
  async findOne(id: string): Promise<SchemaContact> {
    try {
      const response = await apiClient.get<SchemaContact>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a contact
   */
  async update(id: string, dto: UpdateContactDto): Promise<SchemaContact> {
    try {
      const response = await apiClient.put<SchemaContact>(
        `${this.baseUrl}/${id}`,
        dto,
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a contact (soft delete)
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    try {
      const response = await apiClient.delete<{ message: string; id: string }>(
        `${this.baseUrl}/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to delete contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get contact statistics
   */
  async getStatistics(): Promise<ContactStatistics> {
    try {
      const response = await apiClient.get<ContactStatistics>(
        `${this.baseUrl}/statistics`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contact statistics:', error);
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async bulkUpdate(
    ids: string[],
    updates: UpdateContactDto,
  ): Promise<SchemaContact[]> {
    try {
      const promises = ids.map((id) => this.update(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk update contacts:', error);
      throw error;
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    try {
      const promises = ids.map((id) => this.remove(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk delete contacts:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const contactsService = new ContactsService();
export default contactsService;
