/**
 * Properties Zustand Store
 * Single source of truth for property data
 */

'use client';

import { create } from 'zustand';
import { propertiesService } from '@/services/properties.service';
import { transformPropertyListingToUI } from '@/lib/api/properties';
import type { Property } from '@/types/properties';
import type { SellCycle, PurchaseCycle, RentCycle } from '@/types';
import type { PropertyQueryParams } from '@/services/properties.service';

// ============================================================================
// Helpers
// ============================================================================

function paramsKey(params?: PropertyQueryParams): string {
  if (!params) return '{}';
  const p = { page: 1, limit: 1000, ...params };
  const sorted = Object.keys(p)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: (p as Record<string, unknown>)[k] }), {});
  return JSON.stringify(sorted);
}

function transformListingToProperty(listing: Record<string, unknown>): Property {
  const mp = (listing.masterProperty || {}) as Record<string, unknown>;
  const addr = (mp.address || {}) as Record<string, unknown>;
  return {
    id: listing.id as string,
    title: (listing.title as string) || '',
    description: listing.description as string | undefined,
    address:
      typeof addr === 'object'
        ? [addr.plotNo, addr.streetNo, addr.buildingName, (addr.area as Record<string, unknown>)?.name, (addr.city as Record<string, unknown>)?.name]
            .filter(Boolean)
            .join(', ') || ''
        : String(addr),
    addressDetails: addr
      ? {
          cityId: addr.cityId as string,
          cityName: ((addr.city as Record<string, unknown>)?.name as string) ?? '',
          areaId: addr.areaId as string,
          areaName: ((addr.area as Record<string, unknown>)?.name as string) ?? '',
          blockId: addr.blockId as string | undefined,
          blockName: (addr.block as Record<string, unknown>)?.name as string | undefined,
          plotNumber: addr.plotNo as string | undefined,
          buildingName: addr.buildingName as string | undefined,
          floorNumber: addr.floorNo as string | undefined,
          unitNumber: (addr.apartmentNo ?? addr.shopNo) as string | undefined,
        }
      : undefined,
    city: (addr?.city as Record<string, unknown>)?.name as string | undefined,
    area: Number(mp.area) || 0,
    areaUnit: ((mp.areaUnit as string)?.toLowerCase() || 'sqft') as Property['areaUnit'],
    propertyType: ((mp.type as string)?.toLowerCase() || 'house') as Property['propertyType'],
    price: Number(listing.price) || 0,
    status: ((listing.status as string)?.toLowerCase() || 'available') as Property['status'],
    agentId: (listing.agentId as string) || '',
    agentName: (listing.agent as Record<string, unknown>)?.name as string | undefined,
    assignedAgent: listing.agentId as string | undefined,
    assignedAgentName: (listing.agent as Record<string, unknown>)?.name as string | undefined,
    createdBy: (listing.createdBy as string) || (listing.agentId as string) || '',
    sharedWith: [],
    bedrooms: mp.bedrooms as number | undefined,
    bathrooms: mp.bathrooms as number | undefined,
    constructionYear: mp.constructionYear as number | undefined,
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
    currentOwnerName: (mp.currentOwnerName as string) || 'Unknown',
    currentOwnerType: 'client',
    createdAt: (listing.createdAt as string) || new Date().toISOString(),
    updatedAt: (listing.updatedAt as string) || new Date().toISOString(),
  };
}

// ============================================================================
// Types
// ============================================================================

interface PropertyListEntry {
  data: Property[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  isLoading: boolean;
  error: string | null;
}

interface PropertyDetailEntry {
  data: Property | null;
  isLoading: boolean;
  error: string | null;
}

interface PropertyWithCyclesEntry {
  property: Property | null;
  sellCycles: SellCycle[];
  purchaseCycles: PurchaseCycle[];
  rentCycles: RentCycle[];
  isLoading: boolean;
  error: string | null;
}

export interface PropertiesStore {
  lists: Record<string, PropertyListEntry>;
  details: Record<string, PropertyDetailEntry>;
  withCycles: Record<string, PropertyWithCyclesEntry>;
  mutateLoading: boolean;

  fetchList: (params?: PropertyQueryParams) => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  fetchWithCycles: (id: string) => Promise<void>;
  create: (data: Parameters<typeof propertiesService.create>[0]) => Promise<unknown>;
  update: (id: string, data: Parameters<typeof propertiesService.update>[1]) => Promise<unknown>;
  remove: (id: string) => Promise<void>;
  uploadImage: (file: File) => Promise<{ url: string }>;
  invalidateLists: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const usePropertiesStore = create<PropertiesStore>((set, get) => ({
  lists: {},
  details: {},
  withCycles: {},
  mutateLoading: false,

  fetchList: async (params) => {
    const key = paramsKey(params);
    set((s) => ({
      lists: {
        ...s.lists,
        [key]: {
          data: s.lists[key]?.data ?? [],
          pagination: s.lists[key]?.pagination ?? { page: 1, limit: 1000, total: 0, totalPages: 0 },
          isLoading: true,
          error: null,
        },
      },
    }));
    try {
      const response = await propertiesService.findAll({
        page: 1,
        limit: 1000,
        ...params,
      });
      const rawData = response.data || [];
      const transformed = rawData.map((listing: Record<string, unknown> & { masterProperty?: unknown }) =>
        listing.masterProperty
          ? transformPropertyListingToUI(listing as never)
          : transformListingToProperty(listing)
      );
      const pagination = response.pagination || {
        page: 1,
        limit: 1000,
        total: transformed.length,
        totalPages: 1,
      };
      set((s) => ({
        lists: {
          ...s.lists,
          [key]: {
            data: transformed,
            pagination: { ...pagination, totalPages: pagination.totalPages ?? 1 },
            isLoading: false,
            error: null,
          },
        },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load properties';
      set((s) => ({
        lists: {
          ...s.lists,
          [key]: {
            data: [],
            pagination: { page: 1, limit: 1000, total: 0, totalPages: 0 },
            isLoading: false,
            error: msg,
          },
        },
      }));
    }
  },

  fetchDetail: async (id) => {
    set((s) => ({
      details: {
        ...s.details,
        [id]: { data: s.details[id]?.data ?? null, isLoading: true, error: null },
      },
    }));
    try {
      const property = await propertiesService.findOneAsUI(id);
      set((s) => ({
        details: {
          ...s.details,
          [id]: { data: property, isLoading: false, error: null },
        },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load property';
      set((s) => ({
        details: {
          ...s.details,
          [id]: { data: null, isLoading: false, error: msg },
        },
      }));
    }
  },

  fetchWithCycles: async (id) => {
    set((s) => ({
      withCycles: {
        ...s.withCycles,
        [id]: {
          property: s.withCycles[id]?.property ?? null,
          sellCycles: s.withCycles[id]?.sellCycles ?? [],
          purchaseCycles: s.withCycles[id]?.purchaseCycles ?? [],
          rentCycles: s.withCycles[id]?.rentCycles ?? [],
          isLoading: true,
          error: null,
        },
      },
    }));
    try {
      const result = await propertiesService.findOneWithCycles(id);
      set((s) => ({
        withCycles: {
          ...s.withCycles,
          [id]: {
            property: result.property,
            sellCycles: result.sellCycles,
            purchaseCycles: result.purchaseCycles,
            rentCycles: result.rentCycles,
            isLoading: false,
            error: null,
          },
        },
      }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load property';
      set((s) => ({
        withCycles: {
          ...s.withCycles,
          [id]: {
            property: null,
            sellCycles: [],
            purchaseCycles: [],
            rentCycles: [],
            isLoading: false,
            error: msg,
          },
        },
      }));
    }
  },

  create: async (data) => {
    set({ mutateLoading: true });
    try {
      const result = await propertiesService.create(data);
      set({ mutateLoading: false });
      get().invalidateLists();
      return result;
    } catch (err) {
      set({ mutateLoading: false });
      throw err;
    }
  },

  update: async (id, data) => {
    set({ mutateLoading: true });
    try {
      const result = await propertiesService.update(id, data);
      set((s) => {
        const next = { ...s.details };
        delete next[id];
        const nextWithCycles = { ...s.withCycles };
        delete nextWithCycles[id];
        return { details: next, withCycles: nextWithCycles, mutateLoading: false };
      });
      get().invalidateLists();
      return result;
    } catch (err) {
      set({ mutateLoading: false });
      throw err;
    }
  },

  remove: async (id) => {
    set({ mutateLoading: true });
    try {
      await propertiesService.remove(id);
      set((s) => {
        const nextDetails = { ...s.details };
        delete nextDetails[id];
        const nextWithCycles = { ...s.withCycles };
        delete nextWithCycles[id];
        return { details: nextDetails, withCycles: nextWithCycles, mutateLoading: false };
      });
      get().invalidateLists();
    } catch (err) {
      set({ mutateLoading: false });
      throw err;
    }
  },

  uploadImage: async (file) => {
    return propertiesService.uploadImage(file);
  },

  invalidateLists: () => {
    set({ lists: {} });
  },
}));
