/**
 * Professional Properties Service Layer
 * Centralized property operations with proper typing and error handling
 * No components should import from lib/api directly - use this service or hooks
 */

import { apiClient } from '@/lib/api/client';
import type { Property } from '@/types/properties';
import type {
  PropertyListingApiResponse,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyQueryParams,
  PropertyListResponse,
  PropertyStatistics,
} from '@/lib/api/properties';
import { transformPropertyListingToUI } from '@/lib/api/properties';

// Re-export types for consumers
export type {
  CreatePropertyData,
  UpdatePropertyData,
  PropertyQueryParams,
  PropertyListResponse,
  PropertyStatistics,
  PropertyListingApiResponse,
} from '@/lib/api/properties';

export { transformPropertyListingToUI } from '@/lib/api/properties';

// ============================================================================
// Properties Service Class
// ============================================================================

class PropertiesService {
  private readonly baseUrl = '/properties';

  /**
   * Create a new property
   */
  async create(data: CreatePropertyData): Promise<PropertyListingApiResponse> {
    try {
      const response = await apiClient.post<PropertyListingApiResponse>(
        this.baseUrl,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create property:', error);
      throw error;
    }
  }

  /**
   * List properties with filters and pagination
   */
  async findAll(params?: PropertyQueryParams): Promise<PropertyListResponse> {
    try {
      const response = await apiClient.get<PropertyListResponse>(
        this.baseUrl,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      throw error;
    }
  }

  /**
   * Get property by ID
   */
  async findOne(id: string): Promise<PropertyListingApiResponse> {
    try {
      const response = await apiClient.get<PropertyListingApiResponse>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update property
   */
  async update(
    id: string,
    data: UpdatePropertyData
  ): Promise<PropertyListingApiResponse> {
    try {
      const response = await apiClient.put<PropertyListingApiResponse>(
        `${this.baseUrl}/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete property (soft delete)
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    try {
      const response = await apiClient.delete<{ message: string; id: string }>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to delete property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Upload property image (backend uploads to Cloudinary)
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<{ url: string }>(
        `${this.baseUrl}/upload-image`,
        formData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to upload property image:', error);
      throw error;
    }
  }

  /**
   * Get property statistics
   */
  async getStatistics(): Promise<PropertyStatistics> {
    try {
      const response = await apiClient.get<PropertyStatistics>(
        `${this.baseUrl}/statistics`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch property statistics:', error);
      throw error;
    }
  }

  /**
   * Get property by ID and transform to UI format
   */
  async findOneAsUI(id: string): Promise<Property> {
    const listing = await this.findOne(id);
    return transformPropertyListingToUI(listing);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const propertiesService = new PropertiesService();
export default propertiesService;
