/**
 * Rent Cycles Service Layer
 * Thin wrapper around rentCyclesApi with error normalisation.
 * Components and hooks should use this service — not apiClient directly.
 */

import { rentCyclesApi } from '@/lib/api/rent-cycles';
import { apiClient } from '@/lib/api/client';
import type {
  CreateRentCyclePayload,
  UpdateRentCyclePayload,
  RentCycleApiResponse,
} from '@/lib/api/rent-cycles';

export type { CreateRentCyclePayload, UpdateRentCyclePayload, RentCycleApiResponse } from '@/lib/api/rent-cycles';

class RentCyclesService {
  private readonly baseLabel = 'rent cycle';

  async create(data: CreateRentCyclePayload): Promise<RentCycleApiResponse> {
    try {
      return await rentCyclesApi.create(data);
    } catch (error) {
      console.error(`Failed to create ${this.baseLabel}:`, error);
      throw error;
    }
  }

  async findAll(propertyListingId?: string): Promise<RentCycleApiResponse[]> {
    try {
      return await rentCyclesApi.list(propertyListingId);
    } catch (error) {
      console.error(`Failed to fetch ${this.baseLabel}s:`, error);
      throw error;
    }
  }

  async findOne(id: string): Promise<RentCycleApiResponse> {
    try {
      return await rentCyclesApi.getById(id);
    } catch (error) {
      console.error(`Failed to fetch ${this.baseLabel} ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, data: UpdateRentCyclePayload): Promise<RentCycleApiResponse> {
    try {
      return await rentCyclesApi.update(id, data);
    } catch (error) {
      console.error(`Failed to update ${this.baseLabel} ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/rent-cycles/${id}`);
  }

  async addApplication(id: string, contactId: string, notes?: string): Promise<unknown> {
    const response = await apiClient.post(`/rent-cycles/${id}/applications`, { contactId, notes });
    return response.data;
  }

  async approveApplication(id: string, applicationId: string): Promise<unknown> {
    const response = await apiClient.post(`/rent-cycles/${id}/applications/${applicationId}/approve`, {});
    return response.data;
  }

  async signLease(
    id: string,
    payload: { applicationId: string; leaseStartDate: string; leaseEndDate: string },
  ): Promise<unknown> {
    const response = await apiClient.post(`/rent-cycles/${id}/lease`, payload);
    return response.data;
  }

  async recordPayment(
    id: string,
    payload: { month: string; amountPaid: number; paymentDate?: string; notes?: string },
  ): Promise<unknown> {
    const response = await apiClient.post(`/rent-cycles/${id}/payments`, payload);
    return response.data;
  }

  async renewLease(
    id: string,
    payload: { newMonthlyRent: number; newLeasePeriod: number; newEndDate: string },
  ): Promise<unknown> {
    const response = await apiClient.post(`/rent-cycles/${id}/renew`, payload);
    return response.data;
  }

  async endLease(
    id: string,
    payload: { moveOutDate: string; depositReturned?: boolean; notes?: string },
  ): Promise<unknown> {
    const response = await apiClient.post(`/rent-cycles/${id}/end`, payload);
    return response.data;
  }
}

export const rentCyclesService = new RentCyclesService();
