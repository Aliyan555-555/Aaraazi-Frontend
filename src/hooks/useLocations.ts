/**
 * useLocations - Zustand-based
 * Location hierarchy for address forms
 */

'use client';

import { useLocationsStore } from '@/store/useLocationsStore';

export function useLocations() {
  const countries = useLocationsStore((s) => s.countries);
  const countriesLoaded = useLocationsStore((s) => s.countriesLoaded);
  const store = useLocationsStore.getState();

  return {
    getCountries: store.getCountries,
    getCities: store.getCities,
    getAreas: store.getAreas,
    getBlocks: store.getBlocks,
    countries,
    countriesLoaded,
  };
}
