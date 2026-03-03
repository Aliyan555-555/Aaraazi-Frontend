/**
 * Frontend service for fetching location data from the backend API.
 * Replaces hardcoded Karachi area arrays.
 */

import { apiClient } from '@/lib/api/client';

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
}

export interface Area {
  id: string;
  name: string;
  cityId: string;
}

export interface Block {
  id: string;
  name: string;
  areaId: string;
}

class LocationsService {
  async getCountries(): Promise<Country[]> {
    const res = await apiClient.get<Country[]>('/locations/countries');
    return res.data;
  }

  async getCitiesByCountry(countryId: string): Promise<City[]> {
    const res = await apiClient.get<City[]>(`/locations/countries/${countryId}/cities`);
    return res.data;
  }

  async getAreasByCity(cityId: string): Promise<Area[]> {
    const res = await apiClient.get<Area[]>(`/locations/cities/${cityId}/areas`);
    return res.data;
  }

  async getBlocksByArea(areaId: string): Promise<Block[]> {
    const res = await apiClient.get<Block[]>(`/locations/areas/${areaId}/blocks`);
    return res.data;
  }
}

export const locationsService = new LocationsService();
