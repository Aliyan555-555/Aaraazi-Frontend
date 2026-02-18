/**
 * Purchase Cycles API
 */

import { apiClient } from './client';

export interface CreatePurchaseCyclePayload {
  requirementId: string;
  startDate?: string;
  endDate?: string;
}

export type PurchaserTypeFromProperty = 'agency' | 'investor' | 'client';

export interface CreatePurchaseCycleFromPropertyPayload {
  propertyListingId: string;
  purchaserType: PurchaserTypeFromProperty;
  contactId?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  sellerName: string;
  sellerContact?: string;
  offerAmount: number;
  askingPrice?: number;
  financingType?: string;
  targetCloseDate?: string;
  notes?: string;
  purpose?: string;
  expectedResaleValue?: number;
  renovationBudget?: number;
  targetROI?: number;
  investmentNotes?: string;
  facilitationFee?: number;
  commissionRate?: number;
  commissionType?: string;
  buyerBudgetMin?: number;
  buyerBudgetMax?: number;
}

export interface PurchaseCycleApiResponse {
  id: string;
  cycleNumber: string;
  tenantId: string;
  agencyId: string;
  requirementId: string;
  propertyListingId?: string | null;
  agentId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  requirement?: {
    id: string;
    contact?: { id: string; name: string; phone: string | null; email: string | null };
  };
  propertyListing?: { id: string; title: string; propertyType?: string };
  agent?: { id: string; name: string; email: string };
  offers?: Array<{ id: string; amount?: number; status?: string; buyer?: { name: string } }>;
  deals?: Array<{ id: string }>;
}

export interface UpdatePurchaseCyclePayload {
  status?: string;
  endDate?: string | null;
}

export const purchaseCyclesApi = {
  create: async (data: CreatePurchaseCyclePayload): Promise<PurchaseCycleApiResponse> => {
    const response = await apiClient.post<PurchaseCycleApiResponse>('/purchase-cycles', data);
    return response.data;
  },

  list: async (requirementId?: string): Promise<PurchaseCycleApiResponse[]> => {
    const params = requirementId ? { requirementId } : {};
    const response = await apiClient.get<PurchaseCycleApiResponse[]>('/purchase-cycles', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  getById: async (id: string): Promise<PurchaseCycleApiResponse> => {
    const response = await apiClient.get<PurchaseCycleApiResponse>(`/purchase-cycles/${id}`);
    return response.data;
  },

  createFromProperty: async (
    data: CreatePurchaseCycleFromPropertyPayload
  ): Promise<PurchaseCycleApiResponse> => {
    const response = await apiClient.post<PurchaseCycleApiResponse>(
      '/purchase-cycles/from-property',
      data
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdatePurchaseCyclePayload
  ): Promise<PurchaseCycleApiResponse> => {
    const response = await apiClient.patch<PurchaseCycleApiResponse>(
      `/purchase-cycles/${id}`,
      data
    );
    return response.data;
  },
};
