/**
 * Rent Cycles Service Layer
 * Thin wrapper around rentCyclesApi with error normalisation.
 * Components and hooks should use this service — not apiClient directly.
 */

import { rentCyclesApi } from '@/lib/api/rent-cycles';
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
}

export const rentCyclesService = new RentCyclesService();
