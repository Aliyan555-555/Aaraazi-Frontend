/**
 * Locations API Client
 * Handles location hierarchy API calls (countries, cities, areas, blocks)
 */

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  stateProvince?: string;
  createdAt: string;
  country?: {
    name: string;
    code: string;
  };
}

export interface Area {
  id: string;
  name: string;
  cityId: string;
  postalCode?: string;
  createdAt: string;
  city?: {
    name: string;
  };
}

export interface Block {
  id: string;
  name: string;
  areaId: string;
  createdAt: string;
  area?: {
    name: string;
  };
}

export interface CreateAddressData {
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
}

export interface AddressUniqueCheckResponse {
  exists: boolean;
  addressHash: string;
  address?: any;
}

// ============================================================================
// API Methods
// ============================================================================

export const locationsApi = {
  /**
   * Get all countries
   */
  getCountries: async (): Promise<Country[]> => {
    const response = await apiClient.get('/locations/countries');
    return response.data;
  },

  /**
   * Get cities by country ID
   */
  getCities: async (countryId: string): Promise<City[]> => {
    const response = await apiClient.get(`/locations/countries/${countryId}/cities`);
    return response.data;
  },

  /**
   * Get areas by city ID
   */
  getAreas: async (cityId: string): Promise<Area[]> => {
    const response = await apiClient.get(`/locations/cities/${cityId}/areas`);
    return response.data;
  },

  /**
   * Get blocks by area ID
   */
  getBlocks: async (areaId: string): Promise<Block[]> => {
    const response = await apiClient.get(`/locations/areas/${areaId}/blocks`);
    return response.data;
  },

  /**
   * Check if address is unique
   */
  checkAddressUnique: async (addressData: CreateAddressData): Promise<AddressUniqueCheckResponse> => {
    const response = await apiClient.post('/locations/addresses/check-unique', addressData);
    return response.data;
  },

  /**
   * Create or get existing address
   */
  createOrGetAddress: async (addressData: CreateAddressData) => {
    const response = await apiClient.post('/locations/addresses', addressData);
    return response.data;
  },
};

export default locationsApi;
