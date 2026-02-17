/**
 * Sell Cycles API Client
 * Handles sell cycle creation and listing
 */

import { apiClient } from './client';

export interface CreateSellCyclePayload {
  propertyListingId: string;
  askingPrice: number;
  startDate?: string;
  endDate?: string;
  currentOfferPrice?: number;
  notes?: string;
}

export interface SellCycleApiResponse {
  id: string;
  cycleNumber: string;
  tenantId: string;
  agencyId: string;
  propertyListingId: string;
  agentId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  askingPrice: string;
  currentOfferPrice: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  propertyListing?: unknown;
  agent?: { id: string; name: string; email: string };
}

export const sellCyclesApi = {
  create: async (data: CreateSellCyclePayload): Promise<SellCycleApiResponse> => {
    const response = await apiClient.post<SellCycleApiResponse>('/sell-cycles', data);
    return response.data;
  },

  list: async (propertyListingId?: string): Promise<SellCycleApiResponse[]> => {
    const params = propertyListingId ? { propertyListingId } : {};
    const response = await apiClient.get<SellCycleApiResponse[]>('/sell-cycles', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  getById: async (id: string): Promise<SellCycleApiResponse> => {
    const response = await apiClient.get<SellCycleApiResponse>(`/sell-cycles/${id}`);
    return response.data;
  },
};
