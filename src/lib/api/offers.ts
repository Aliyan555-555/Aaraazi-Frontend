/**
 * Offers API Client
 * Handles offer creation, acceptance, rejection, and counter-offers
 */

import { apiClient } from './client';

export interface CreateOfferPayload {
  /** When set, the offer is linked to this existing contact (buyerName/buyerContact optional). */
  contactId?: string;
  buyerName?: string;
  buyerContact?: string;
  offerAmount: number;
  tokenAmount?: number;
  conditions?: string;
  validUntil?: string;
  notes?: string;
  agentNotes?: string;
}

export interface CounterOfferPayload {
  counterAmount: number;
}

export interface OfferApiResponse {
  id: string;
  offerNumber: string;
  sellCycleId: string;
  buyerId: string;
  amount: string;
  tokenAmount?: string;
  counterOfferAmount?: string;
  conditions?: string;
  status: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

export interface AcceptOfferResponse {
  offer: OfferApiResponse;
  dealId: string;
}

export const offersApi = {
  /**
   * Create an offer on a sell cycle
   */
  create: async (
    sellCycleId: string,
    payload: CreateOfferPayload,
  ): Promise<OfferApiResponse> => {
    const response = await apiClient.post<OfferApiResponse>(
      `/sell-cycles/${sellCycleId}/offers`,
      payload,
    );
    return response.data;
  },

  /**
   * Accept an offer
   */
  accept: async (
    sellCycleId: string,
    offerId: string,
  ): Promise<AcceptOfferResponse> => {
    const response = await apiClient.post<AcceptOfferResponse>(
      `/sell-cycles/${sellCycleId}/offers/${offerId}/accept`,
    );
    return response.data;
  },

  /**
   * Reject an offer
   */
  reject: async (
    sellCycleId: string,
    offerId: string,
  ): Promise<OfferApiResponse> => {
    const response = await apiClient.post<OfferApiResponse>(
      `/sell-cycles/${sellCycleId}/offers/${offerId}/reject`,
    );
    return response.data;
  },

  /**
   * Counter an offer
   */
  counter: async (
    sellCycleId: string,
    offerId: string,
    payload: CounterOfferPayload,
  ): Promise<OfferApiResponse> => {
    const response = await apiClient.post<OfferApiResponse>(
      `/sell-cycles/${sellCycleId}/offers/${offerId}/counter`,
      payload,
    );
    return response.data;
  },
};
