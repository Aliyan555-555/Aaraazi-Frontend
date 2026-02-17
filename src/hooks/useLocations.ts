/**
 * useLocations - Location hierarchy for address forms
 * No direct API calls in components - use this hook
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import type { Country, City, Area, Block } from '@/lib/api/locations';

export function useLocations() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const countriesCache = useRef<Country[] | null>(null);

  const getCountries = useCallback(async (): Promise<Country[]> => {
    if (countriesCache.current && countriesCache.current.length > 0) {
      return countriesCache.current;
    }
    const response = await apiClient.get<Country[]>('/locations/countries');
    const data = response.data || [];
    countriesCache.current = data;
    setCountries(data);
    setCountriesLoaded(true);
    return data;
  }, []);

  const getCities = useCallback(async (countryId: string): Promise<City[]> => {
    const response = await apiClient.get<City[]>(
      `/locations/countries/${countryId}/cities`
    );
    return response.data || [];
  }, []);

  const getAreas = useCallback(async (cityId: string): Promise<Area[]> => {
    const response = await apiClient.get<Area[]>(
      `/locations/cities/${cityId}/areas`
    );
    return response.data || [];
  }, []);

  const getBlocks = useCallback(async (areaId: string): Promise<Block[]> => {
    const response = await apiClient.get<Block[]>(
      `/locations/areas/${areaId}/blocks`
    );
    return response.data || [];
  }, []);

  return {
    getCountries,
    getCities,
    getAreas,
    getBlocks,
    countries,
    countriesLoaded,
  };
}
