/**
 * Rent Cycles API Client
 * Handles rent cycle CRUD operations against the NestJS backend.
 */

import { apiClient } from './client';

// ─────────────────────────────────────────────────────────────
// Request payload types
// ─────────────────────────────────────────────────────────────

export interface CreateRentCyclePayload {
  /** The property listing this rent cycle is for */
  propertyListingId: string;
  /** Monthly rent in PKR */
  monthlyRent: number;
  /** Refundable security deposit in PKR */
  securityDeposit?: number;
  /** Lease duration in months (e.g. 12) */
  leasePeriod: number;
  /** ISO date string — when property is available for move-in */
  availableFrom: string;
  /** Minimum lease period landlord will accept */
  minimumLeasePeriod?: number;
  /** Whether utilities are included in rent */
  utilitiesIncluded: boolean;
  /** Whether maintenance is included */
  maintenanceIncluded: boolean;
  /** Who handles maintenance: 'landlord' | 'tenant' | 'shared' */
  maintenanceResponsibility?: string;
  /** Day of month rent is due (1–31) */
  rentDueDay: number;
  /** Whether to publish / share with other agents */
  isPublished?: boolean;
}

export interface UpdateRentCyclePayload {
  status?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  leasePeriod?: number;
  availableFrom?: string;
  minimumLeasePeriod?: number;
  utilitiesIncluded?: boolean;
  maintenanceIncluded?: boolean;
  maintenanceResponsibility?: string;
  rentDueDay?: number;
  isPublished?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Response types (mirror the Prisma model + includes)
// ─────────────────────────────────────────────────────────────

export interface RentCycleApiResponse {
  id: string;
  cycleNumber: string;
  tenantId: string;
  agencyId: string;
  propertyListingId: string;
  agentId: string;
  status: string;
  monthlyRent: string;         // Decimal serialised as string
  securityDeposit: string | null;
  leasePeriod: number;
  availableFrom: string;
  minimumLeasePeriod: number | null;
  utilitiesIncluded: boolean;
  maintenanceIncluded: boolean;
  maintenanceResponsibility: string | null;
  rentDueDay: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  /** Included when fetching a single cycle or list */
  propertyListing?: {
    id: string;
    title: string;
    price: string;
    images: string;
    masterProperty?: {
      id: string;
      type: string;
      address?: {
        id: string;
        street: string | null;
        city?: { id: string; name: string };
        area?: { id: string; name: string };
      };
    };
  };
  agent?: { id: string; name: string; email: string };
  offers?: RentCycleOffer[];
  leases?: RentCycleLease[];
}

export interface RentCycleOffer {
  id: string;
  offerNumber: string;
  amount: string;
  status: string;
  createdAt: string;
  buyer?: { id: string; name: string; phone: string | null; email: string | null };
}

export interface RentCycleLease {
  id: string;
  leaseNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  status: string;
  createdAt: string;
  tenantContact?: { id: string; name: string; phone: string | null; email: string | null };
}

// ─────────────────────────────────────────────────────────────
// API client methods
// ─────────────────────────────────────────────────────────────

export const rentCyclesApi = {
  /**
   * Create a new rent cycle for a property listing.
   * POST /rent-cycles
   */
  create: async (data: CreateRentCyclePayload): Promise<RentCycleApiResponse> => {
    const response = await apiClient.post<RentCycleApiResponse>('/rent-cycles', data);
    return response.data;
  },

  /**
   * List all rent cycles, optionally filtered by property listing.
   * GET /rent-cycles?propertyListingId=xxx
   */
  list: async (propertyListingId?: string): Promise<RentCycleApiResponse[]> => {
    const params = propertyListingId ? { propertyListingId } : {};
    const response = await apiClient.get<RentCycleApiResponse[]>('/rent-cycles', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get a single rent cycle by ID.
   * GET /rent-cycles/:id
   */
  getById: async (id: string): Promise<RentCycleApiResponse> => {
    const response = await apiClient.get<RentCycleApiResponse>(`/rent-cycles/${id}`);
    return response.data;
  },

  /**
   * Update mutable fields or status of a rent cycle.
   * PATCH /rent-cycles/:id
   */
  update: async (id: string, data: UpdateRentCyclePayload): Promise<RentCycleApiResponse> => {
    const response = await apiClient.patch<RentCycleApiResponse>(`/rent-cycles/${id}`, data);
    return response.data;
  },
};
