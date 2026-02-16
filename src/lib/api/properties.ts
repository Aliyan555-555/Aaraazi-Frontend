/**
 * Properties API Client
 * Handles all property-related API calls
 */

import { apiClient } from "./client";
import type {
  PropertyListing,
  PropertyType,
  PropertyListingStatus,
  ListingType,
  AreaUnit,
} from "@prisma/client";

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
  sortOrder?: "asc" | "desc";
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
// Backend API Response Shape (PropertyListing + MasterProperty includes)
// ============================================================================

/** Shape returned by GET /properties/:id with all includes */
export interface PropertyListingApiResponse {
  id: string;
  tenantId: string;
  agencyId: string;
  branchId: string | null;
  agentId: string;
  masterPropertyId: string;
  visibility: string;
  acquisitionType: string;
  title: string;
  description: string | null;
  listingType: string; // 'SALE' | 'RENT'
  status: string; // PropertyListingStatus enum
  price: string; // Decimal as string
  images: string; // Comma-separated URLs
  notes: string | null;
  isPrivate: boolean;
  isArchived: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  masterProperty: {
    id: string;
    propertyCode: string;
    addressId: string;
    type: string; // PropertyType enum
    area: string; // Decimal as string
    areaUnit: string; // AreaUnit enum
    bedrooms: number | null;
    bathrooms: number | null;
    features: string; // Comma-separated
    constructionYear: number | null;
    currentOwnerName: string | null;
    currentOwnerCNIC: string | null;
    currentOwnerPhone: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    address: {
      id: string;
      addressType: string;
      countryId: string;
      cityId: string;
      areaId: string;
      blockId: string | null;
      plotNo: string | null;
      streetNo: string | null;
      buildingName: string | null;
      floorNo: string | null;
      apartmentNo: string | null;
      shopNo: string | null;
      fullAddress: string | null;
      postalCode: string | null;
      city: { id: string; name: string } | null;
      area: { id: string; name: string } | null;
      block: { id: string; name: string } | null;
    };
  };
  agent: {
    id: string;
    name: string;
    email: string;
  } | null;
  branch: {
    id: string;
    name: string;
  } | null;
}

// ============================================================================
// Transformer: Backend → UI Property
// ============================================================================

import type {
  Property,
  PropertyStatus,
  PropertyAddress,
} from "@/types/properties";
import type { AreaUnit as UIAreaUnit } from "@/types/properties";

/** Map backend PropertyListingStatus → UI PropertyStatus */
function mapStatus(status: string): PropertyStatus {
  const statusMap: Record<string, PropertyStatus> = {
    DRAFT: "available",
    ACTIVE: "available",
    UNDER_OFFER: "under-offer",
    UNDER_CONTRACT: "under-contract",
    SOLD: "sold",
    RENTED: "rented",
    EXPIRED: "available",
    WITHDRAWN: "available",
  };
  return statusMap[status] ?? "available";
}

/** Map backend AreaUnit enum → UI AreaUnit */
function mapAreaUnit(unit: string): UIAreaUnit {
  const unitMap: Record<string, UIAreaUnit> = {
    SQFT: "SQFT",
    SQMETER: "SQMETER",
    SQYARDS: "SQYARDS",
    MARLA: "MARLA",
    KANAL: "KANAL",
    ACRE: "ACRE",
    HECTARE: "HECTARE",
  };
  return unitMap[unit] ?? "SQFT";
}

/** Map backend ListingType → UI listingType */
function mapListingType(lt: string): Property["listingType"] {
  const ltMap: Record<string, Property["listingType"]> = {
    SALE: "for-sale",
    RENT: "for-rent",
  };
  return ltMap[lt] ?? "sale";
}

/** Build a formatted full address string from the nested address data */
function buildFullAddress(
  addr: PropertyListingApiResponse["masterProperty"]["address"],
): string {
  const parts: string[] = [];
  if (addr.plotNo) parts.push(`Plot ${addr.plotNo}`);
  if (addr.streetNo) parts.push(`Street ${addr.streetNo}`);
  if (addr.buildingName) parts.push(addr.buildingName);
  if (addr.floorNo) parts.push(`Floor ${addr.floorNo}`);
  if (addr.apartmentNo) parts.push(`Apt ${addr.apartmentNo}`);
  if (addr.shopNo) parts.push(`Shop ${addr.shopNo}`);
  if (addr.block?.name) parts.push(addr.block.name);
  if (addr.area?.name) parts.push(addr.area.name);
  if (addr.city?.name) parts.push(addr.city.name);
  return parts.join(", ") || addr.fullAddress || "Unknown Address";
}

/**
 * Transform backend PropertyListing API response → UI Property interface.
 * This is the critical bridge between the split MasterProperty+PropertyListing
 * backend model and the flat Property interface the UI components expect.
 */
export function transformPropertyListingToUI(
  listing: PropertyListingApiResponse,
): Property {
  const mp = listing.masterProperty;
  const addr = mp.address;

  // Build PropertyAddress for the addressDetails field
  const addressDetails: PropertyAddress = {
    cityId: addr.cityId,
    cityName: addr.city?.name ?? "",
    areaId: addr.areaId,
    areaName: addr.area?.name ?? "",
    blockId: addr.blockId ?? undefined,
    blockName: addr.block?.name ?? undefined,
    plotNumber: addr.plotNo ?? undefined,
    buildingName: addr.buildingName ?? undefined,
    floorNumber: addr.floorNo ?? undefined,
    unitNumber: addr.apartmentNo ?? addr.shopNo ?? undefined,
  };

  // Parse features from comma-separated string
  const features = mp.features
    ? mp.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  // Parse images from comma-separated string
  const images = listing.images
    ? listing.images
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean)
    : [];

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description ?? undefined,
    address: buildFullAddress(addr),
    addressDetails,
    city: addr.city?.name ?? undefined,
    area: Number(mp.area) || 0,
    areaUnit: mapAreaUnit(mp.areaUnit),
    propertyType: mp.type.toLowerCase() as Property["propertyType"],
    price: Number(listing.price) || 0,
    status: mapStatus(listing.status),
    agentId: listing.agentId,
    agentName: listing.agent?.name ?? undefined,
    assignedAgent: listing.agentId,
    assignedAgentName: listing.agent?.name ?? undefined,
    createdBy: listing.createdBy ?? listing.agentId,
    sharedWith: [],

    // Specs from MasterProperty
    bedrooms: mp.bedrooms ?? undefined,
    bathrooms: mp.bathrooms ?? undefined,
    constructionYear: mp.constructionYear ?? undefined,
    features,
    images,

    // Listing info
    listingType: mapListingType(listing.listingType),
    notes: listing.notes ?? undefined,
    isPublished: !listing.isPrivate,
    archived: listing.isArchived,

    // Owner info from MasterProperty
    currentOwnerName: mp.currentOwnerName ?? undefined,
    currentOwnerType: "client",

    // Timestamps
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
}

// ============================================================================
// API Methods
// ============================================================================

export const propertiesApi = {
  /**
   * Create a new property
   */
  create: async (data: CreatePropertyData) => {
    const response = await apiClient.post("/properties", data);
    return response.data;
  },

  /**
   * Upload a property image via backend (backend uploads to Cloudinary).
   * Returns the Cloudinary URL to store in the property.
   */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ url: string }>(
      "/properties/upload-image",
      formData,
    );
    return response.data;
  },

  /**
   * List properties with filters and pagination
   */
  list: async (params?: PropertyQueryParams): Promise<PropertyListResponse> => {
    const response = await apiClient.get("/properties", { params });
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
    const response = await apiClient.get("/properties/statistics");
    return response.data;
  },
};

export default propertiesApi;
