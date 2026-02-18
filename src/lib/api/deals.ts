/**
 * Deals API Client
 * GET /deals (list), GET /deals/:id (one)
 */

import { apiClient } from './client';

/** Backend deal list item (from findAll) */
export interface DealListApiResponse {
  id: string;
  dealNumber: string;
  tenantId: string;
  agencyId: string;
  status: string;
  stage: string;
  agreedPrice: string;
  commissionTotal: string | null;
  createdAt: string;
  updatedAt: string;
  primaryAgent?: { id: string; name: string; email: string };
  secondaryAgent?: { id: string; name: string; email: string } | null;
  buyerContact?: { id: string; name: string; phone: string | null; email: string | null } | null;
  sellerContact?: { id: string; name: string; phone: string | null; email: string | null } | null;
  propertyListing?: {
    id: string;
    title: string;
    masterProperty?: {
      address?: {
        fullAddress: string | null;
        city?: { name: string };
        area?: { name: string };
      };
    };
  } | null;
}

/** Backend deal detail (from findOne with includes) */
export interface DealDetailApiResponse extends DealListApiResponse {
  notes: string;
  closingDate: string | null;
  actualClosingDate: string | null;
  sellCycle?: { id: string; cycleNumber: string; agentId: string } | null;
  purchaseCycle?: { id: string; cycleNumber: string; agentId: string } | null;
  payments?: Array<{
    id: string;
    amount: string;
    dueDate: string;
    paidDate: string | null;
    paymentNumber: string;
  }>;
  stageTrackings?: Array<{
    id: string;
    stage: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
  }>;
  notesRel?: Array<{
    id: string;
    content: string;
    createdAt: string;
    createdBy: string | null;
  }>;
  paymentSchedules?: Array<{
    id: string;
    totalAmount: string;
    status: string;
    payments: Array<{
      id: string;
      amount: string;
      dueDate: string;
      paidDate: string | null;
    }>;
  }>;
}

export const dealsApi = {
  list: async (): Promise<DealListApiResponse[]> => {
    const response = await apiClient.get<DealListApiResponse[]>('/deals');
    return Array.isArray(response.data) ? response.data : [];
  },

  getById: async (id: string): Promise<DealDetailApiResponse | null> => {
    try {
      const response = await apiClient.get<DealDetailApiResponse>(`/deals/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  getBySellCycleId: async (sellCycleId: string): Promise<DealListApiResponse[]> => {
    const response = await apiClient.get<DealListApiResponse[]>(
      `/deals/by-sell-cycle/${sellCycleId}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },
};
