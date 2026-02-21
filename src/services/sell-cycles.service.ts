/**
 * Sell Cycles Service Layer
 * No direct API calls in components - use this service or hooks
 */

import { apiClient } from '@/lib/api/client';
import type { CreateSellCyclePayload, SellCycleApiResponse } from '@/lib/api/sell-cycles';

export type { CreateSellCyclePayload, SellCycleApiResponse } from '@/lib/api/sell-cycles';

class SellCyclesService {
  private readonly baseUrl = '/sell-cycles';

  async create(data: CreateSellCyclePayload): Promise<SellCycleApiResponse> {
    try {
      const response = await apiClient.post<SellCycleApiResponse>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Failed to create sell cycle:', error);
      throw error;
    }
  }

  async findAll(propertyListingId?: string): Promise<SellCycleApiResponse[]> {
    try {
      const params = propertyListingId ? { propertyListingId } : {};
      const response = await apiClient.get<SellCycleApiResponse[]>(this.baseUrl, { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch sell cycles:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<SellCycleApiResponse> {
    try {
      const response = await apiClient.get<SellCycleApiResponse>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch sell cycle ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<{
    askingPrice: number;
    currentOfferPrice: number;
    status: string;
    endDate: string;
    notes: string;
    commissionRate: number;
  }>): Promise<SellCycleApiResponse> {
    const response = await apiClient.patch<SellCycleApiResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getOffers(id: string): Promise<unknown[]> {
    const response = await apiClient.get<unknown[]>(`${this.baseUrl}/${id}/offers`);
    return Array.isArray(response.data) ? response.data : [];
  }
}

export const sellCyclesService = new SellCyclesService();
