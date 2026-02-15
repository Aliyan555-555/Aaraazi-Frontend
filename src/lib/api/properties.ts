/**
 * Properties API Client
 * Handles all property-related API calls
 */

import { apiClient } from './client';
import type { 
  PropertyListing, 
  PropertyType, 
  PropertyListingStatus, 
  ListingType, 
  AreaUnit 
} from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export interface CreatePropertyData {
  // Property Type
  propertyType: PropertyType;

  // Address
  address: {
    addressType: string;
    countryId: string;
    cityId: string;
    areaId: string;
    blockId?: string;
    plotNo?: string;
    streetNo?: string;
    buildingName?: string;
    floorNo?: string;
    apartmentNo?: string;
    shopNo?: string;
    fullAddress?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };

  // Owner
  contactId?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerCNIC?: string;

  // Physical Details
  area: number;
  areaUnit: AreaUnit;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  constructionYear?: number;

  // Optional
  features?: string[];
  description?: string;
  images?: string[];

  // Context
  tenantId: string;
  agencyId: string;
  branchId?: string;
}

export interface UpdatePropertyData {
  title?: string;
  description?: string;
  status?: PropertyListingStatus;
  listingType?: ListingType;
  price?: number;
  images?: string[];
  isPrivate?: boolean;
  isFeatured?: boolean;
  notes?: string;
}

export interface PropertyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PropertyListingStatus;
  listingType?: ListingType;
  propertyType?: PropertyType;
  cityId?: string;
  areaId?: string;
  isPrivate?: boolean;
  isFeatured?: boolean;
  isArchived?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PropertyListResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PropertyStatistics {
  total: number;
  draft: number;
  active: number;
  archived: number;
  forSale: number;
  forRent: number;
}

// ============================================================================
// API Methods
// ============================================================================

export const propertiesApi = {
  /**
   * Create a new property
   */
  create: async (data: CreatePropertyData) => {
    const response = await apiClient.post('/properties', data);
    return response.data;
  },

  /**
   * Upload a property image via backend (backend uploads to Cloudinary).
   * Returns the Cloudinary URL to store in the property.
   */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string }>('/properties/upload-image', formData);
    return response.data;
  },

  /**
   * List properties with filters and pagination
   */
  list: async (params?: PropertyQueryParams): Promise<PropertyListResponse> => {
    const response = await apiClient.get('/properties', { params });
    return response.data;
  },

  /**
   * Get property by ID
   */
  getById: async (id: string) => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  /**
   * Update property
   */
  update: async (id: string, data: UpdatePropertyData) => {
    const response = await apiClient.put(`/properties/${id}`, data);
    return response.data;
  },

  /**
   * Delete property (soft delete)
   */
  delete: async (id: string) => {
    const response = await apiClient.delete(`/properties/${id}`);
    return response.data;
  },

  /**
   * Get property statistics
   */
  statistics: async (): Promise<PropertyStatistics> => {
    const response = await apiClient.get('/properties/statistics');
    return response.data;
  },
};

export default propertiesApi;
