/**
 * Offers Service Layer
 * Handles offer operations
 */

import { offersApi, CreateOfferPayload } from '@/lib/api/offers';
import type { OfferApiResponse, AcceptOfferResponse } from '@/lib/api/offers';
import { apiClient } from '@/lib/api/client';

export type { CreateOfferPayload, OfferApiResponse, AcceptOfferResponse } from '@/lib/api/offers';

class OffersService {
  async create(
    sellCycleId: string,
    payload: CreateOfferPayload,
  ): Promise<OfferApiResponse> {
    try {
      return await offersApi.create(sellCycleId, payload);
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  async accept(
    sellCycleId: string,
    offerId: string,
  ): Promise<AcceptOfferResponse> {
    try {
      return await offersApi.accept(sellCycleId, offerId);
    } catch (error) {
      console.error('Failed to accept offer:', error);
      throw error;
    }
  }

  async reject(
    sellCycleId: string,
    offerId: string,
  ): Promise<OfferApiResponse> {
    try {
      return await offersApi.reject(sellCycleId, offerId);
    } catch (error) {
      console.error('Failed to reject offer:', error);
      throw error;
    }
  }

  async findAll(sellCycleId: string): Promise<OfferApiResponse[]> {
    const response = await apiClient.get<OfferApiResponse[]>(
      `/sell-cycles/${sellCycleId}/offers`,
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async findOne(sellCycleId: string, offerId: string): Promise<OfferApiResponse> {
    const response = await apiClient.get<OfferApiResponse>(
      `/sell-cycles/${sellCycleId}/offers/${offerId}`,
    );
    return response.data;
  }
}

export const offersService = new OffersService();
