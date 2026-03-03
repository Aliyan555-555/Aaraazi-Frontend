/**
 * Locations Zustand Store
 */

'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';
import type { Country, City, Area, Block } from '@/lib/api/locations';

export interface LocationsStore {
  countries: Country[];
  countriesLoaded: boolean;
  cities: Record<string, City[]>;
  areas: Record<string, Area[]>;
  blocks: Record<string, Block[]>;

  getCountries: () => Promise<Country[]>;
  getCities: (countryId: string) => Promise<City[]>;
  getAreas: (cityId: string) => Promise<Area[]>;
  getBlocks: (areaId: string) => Promise<Block[]>;
}

export const useLocationsStore = create<LocationsStore>((set, get) => ({
  countries: [],
  countriesLoaded: false,
  cities: {},
  areas: {},
  blocks: {},

  getCountries: async () => {
    const { countries, countriesLoaded } = get();
    if (countriesLoaded && countries.length > 0) return countries;
    const response = await apiClient.get<Country[]>('/locations/countries');
    const data = response.data || [];
    set({ countries: data, countriesLoaded: true });
    return data;
  },

  getCities: async (countryId: string) => {
    const { cities } = get();
    if (cities[countryId]?.length) return cities[countryId];
    const response = await apiClient.get<City[]>(`/locations/countries/${countryId}/cities`);
    const data = response.data || [];
    set((s) => ({ cities: { ...s.cities, [countryId]: data } }));
    return data;
  },

  getAreas: async (cityId: string) => {
    const { areas } = get();
    if (areas[cityId]?.length) return areas[cityId];
    const response = await apiClient.get<Area[]>(`/locations/cities/${cityId}/areas`);
    const data = response.data || [];
    set((s) => ({ areas: { ...s.areas, [cityId]: data } }));
    return data;
  },

  getBlocks: async (areaId: string) => {
    const { blocks } = get();
    if (blocks[areaId]?.length) return blocks[areaId];
    const response = await apiClient.get<Block[]>(`/locations/areas/${areaId}/blocks`);
    const data = response.data || [];
    set((s) => ({ blocks: { ...s.blocks, [areaId]: data } }));
    return data;
  },
}));
