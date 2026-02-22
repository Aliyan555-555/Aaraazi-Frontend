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
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    category: string;
    status: string;
    uploadedAt: string;
    uploadedBy?: string | null;
  }>;
  commissions?: Array<{
    id: string; // Commission record id (for updateCommissionStatus)
    agentId: string;
    amount: string;
    rate?: string | null;
    splitPercentage?: string | null;
    status: string;
    paidAt?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    agent?: { id: string; name: string; email: string };
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueDate: string;
    status: string;
    priority: string;
    type?: string;
    assignedToId: string;
    assignedTo?: { id: string; name: string; email: string };
    completedAt?: string | null;
    createdAt?: string;
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
