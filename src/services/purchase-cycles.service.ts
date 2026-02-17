/**
 * Purchase Cycles Service
 */

import { apiClient } from '@/lib/api/client';
import type {
  CreatePurchaseCyclePayload,
  CreatePurchaseCycleFromPropertyPayload,
  PurchaseCycleApiResponse,
} from '@/lib/api/purchase-cycles';

export type {
  CreatePurchaseCyclePayload,
  CreatePurchaseCycleFromPropertyPayload,
  PurchaseCycleApiResponse,
} from '@/lib/api/purchase-cycles';

class PurchaseCyclesService {
  private readonly baseUrl = '/purchase-cycles';

  async create(data: CreatePurchaseCyclePayload): Promise<PurchaseCycleApiResponse> {
    const response = await apiClient.post<PurchaseCycleApiResponse>(this.baseUrl, data);
    return response.data;
  }

  async createFromProperty(
    data: CreatePurchaseCycleFromPropertyPayload
  ): Promise<PurchaseCycleApiResponse> {
    const response = await apiClient.post<PurchaseCycleApiResponse>(
      `${this.baseUrl}/from-property`,
      data
    );
    return response.data;
  }

  async findAll(requirementId?: string): Promise<PurchaseCycleApiResponse[]> {
    const params = requirementId ? { requirementId } : {};
    const response = await apiClient.get<PurchaseCycleApiResponse[]>(this.baseUrl, { params });
    return Array.isArray(response.data) ? response.data : [];
  }

  async findOne(id: string): Promise<PurchaseCycleApiResponse> {
    const response = await apiClient.get<PurchaseCycleApiResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export const purchaseCyclesService = new PurchaseCyclesService();
