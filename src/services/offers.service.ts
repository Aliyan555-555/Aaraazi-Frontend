/**
 * Offers Service Layer
 * Handles offer operations
 */

import { offersApi, CreateOfferPayload, CounterOfferPayload } from '@/lib/api/offers';
import type { OfferApiResponse, AcceptOfferResponse } from '@/lib/api/offers';

export type { CreateOfferPayload, CounterOfferPayload, OfferApiResponse, AcceptOfferResponse } from '@/lib/api/offers';

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

  async counter(
    sellCycleId: string,
    offerId: string,
    counterAmount: number,
  ): Promise<OfferApiResponse> {
    try {
      return await offersApi.counter(sellCycleId, offerId, { counterAmount });
    } catch (error) {
      console.error('Failed to counter offer:', error);
      throw error;
    }
  }
}

export const offersService = new OffersService();
