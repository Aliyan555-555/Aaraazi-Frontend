/**
 * Professional Properties Hooks
 * Encapsulates all property data fetching - no API calls in components
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { propertiesService } from '@/services/properties.service';
import { transformPropertyListingToUI } from '@/lib/api/properties';
import type { Property } from '@/types/properties';
import type { SellCycle, PurchaseCycle, RentCycle } from '@/types';
import type { PropertyQueryParams } from '@/services/properties.service';

// ============================================================================
// useProperties - List properties with pagination
// ============================================================================

export function useProperties(params?: PropertyQueryParams) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await propertiesService.findAll({
        page: 1,
        limit: 1000,
        ...params,
      });
      const rawData = response.data || [];
      const transformed = rawData.map((listing: any) =>
        listing.masterProperty
          ? transformPropertyListingToUI(listing)
          : transformListingToProperty(listing)
      );
      setProperties(transformed);
      setPagination(response.pagination || {
        page: 1,
        limit: 1000,
        total: transformed.length,
        totalPages: 1,
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load properties';
      setError(message);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [params?.page, params?.limit, params?.search, params?.status]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    pagination,
    isLoading,
    error,
    refetch: fetchProperties,
  };
}

/** Fallback transform for list response items that may not have full structure */
function transformListingToProperty(listing: any): Property {
  const mp = listing.masterProperty || {};
  const addr = mp.address || {};
  return {
    id: listing.id,
    title: listing.title || '',
    description: listing.description,
    address:
      typeof addr === 'object'
        ? [addr.plotNo, addr.streetNo, addr.buildingName, addr.area?.name, addr.city?.name]
            .filter(Boolean)
            .join(', ') || ''
        : String(addr),
    addressDetails: addr
      ? {
          cityId: addr.cityId,
          cityName: addr.city?.name ?? '',
          areaId: addr.areaId,
          areaName: addr.area?.name ?? '',
          blockId: addr.blockId,
          blockName: addr.block?.name,
          plotNumber: addr.plotNo,
          buildingName: addr.buildingName,
          floorNumber: addr.floorNo,
          unitNumber: addr.apartmentNo || addr.shopNo,
        }
      : undefined,
    city: addr.city?.name,
    area: Number(mp.area) || 0,
    areaUnit: (mp.areaUnit?.toLowerCase() || 'sqft') as Property['areaUnit'],
    propertyType: (mp.type?.toLowerCase() || 'house') as Property['propertyType'],
    price: Number(listing.price) || 0,
    status: (listing.status?.toLowerCase() || 'available') as Property['status'],
    agentId: listing.agentId || '',
    agentName: listing.agent?.name,
    assignedAgent: listing.agentId,
    assignedAgentName: listing.agent?.name,
    createdBy: listing.createdBy || listing.agentId || '',
    sharedWith: [],
    bedrooms: mp.bedrooms,
    bathrooms: mp.bathrooms,
    constructionYear: mp.constructionYear,
    features: mp.features
      ? String(mp.features)
          .split(',')
          .map((f: string) => f.trim())
          .filter(Boolean)
      : [],
    images: listing.images
      ? String(listing.images)
          .split(',')
          .map((u: string) => u.trim())
          .filter(Boolean)
      : [],
    currentOwnerName: mp.currentOwnerName || 'Unknown',
    currentOwnerType: 'client',
    createdAt: listing.createdAt || new Date().toISOString(),
    updatedAt: listing.updatedAt || new Date().toISOString(),
  };
}

// ============================================================================
// useProperty - Single property by ID
// ============================================================================

export function useProperty(id: string | undefined, enabled = true) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setProperty(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const uiProperty = await propertiesService.findOneAsUI(id);
      setProperty(uiProperty);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load property';
      setError(message);
      setProperty(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (enabled && id) {
      fetchProperty();
    } else {
      setProperty(null);
      setError(null);
      setIsLoading(false);
    }
  }, [id, enabled, fetchProperty]);

  return {
    property,
    isLoading,
    error,
    refetch: fetchProperty,
  };
}

// ============================================================================
// usePropertyWithCycles - Single property + all cycles in one API call
// ============================================================================

export function usePropertyWithCycles(id: string | undefined, enabled = true) {
  const [property, setProperty] = useState<Property | null>(null);
  const [sellCycles, setSellCycles] = useState<SellCycle[]>([]);
  const [purchaseCycles, setPurchaseCycles] = useState<PurchaseCycle[]>([]);
  const [rentCycles, setRentCycles] = useState<RentCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyWithCycles = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setProperty(null);
      setSellCycles([]);
      setPurchaseCycles([]);
      setRentCycles([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const result = await propertiesService.findOneWithCycles(id);
      setProperty(result.property);
      setSellCycles(result.sellCycles);
      setPurchaseCycles(result.purchaseCycles);
      setRentCycles(result.rentCycles);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load property';
      setError(message);
      setProperty(null);
      setSellCycles([]);
      setPurchaseCycles([]);
      setRentCycles([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (enabled && id) {
      fetchPropertyWithCycles();
    } else {
      setProperty(null);
      setSellCycles([]);
      setPurchaseCycles([]);
      setRentCycles([]);
      setError(null);
      setIsLoading(false);
    }
  }, [id, enabled, fetchPropertyWithCycles]);

  return {
    property,
    sellCycles,
    purchaseCycles,
    rentCycles,
    isLoading,
    error,
    refetch: fetchPropertyWithCycles,
  };
}

// ============================================================================
// usePropertyMutations - Create, update, delete, upload
// ============================================================================

export function usePropertyMutations() {
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback(
    async (data: Parameters<typeof propertiesService.create>[0]) => {
      setIsLoading(true);
      try {
        return await propertiesService.create(data);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const update = useCallback(
    async (
      id: string,
      data: Parameters<typeof propertiesService.update>[1]
    ) => {
      setIsLoading(true);
      try {
        return await propertiesService.update(id, data);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      return await propertiesService.remove(id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadImage = useCallback(async (file: File) => {
    return await propertiesService.uploadImage(file);
  }, []);

  return {
    create,
    update,
    remove,
    uploadImage,
    isLoading,
  };
}
