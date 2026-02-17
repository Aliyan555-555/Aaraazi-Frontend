/**
 * Requirements API (for purchase cycle flow)
 */

import { apiClient } from './client';

export interface RequirementApiResponse {
  id: string;
  requirementNumber: string;
  type: string;
  status: string;
  propertyType: string;
  minPrice?: string;
  maxPrice?: string;
  contact?: { id: string; name: string; phone: string | null; email: string | null };
}

export async function listRequirements(): Promise<RequirementApiResponse[]> {
  const response = await apiClient.get<RequirementApiResponse[]>('/requirements');
  return Array.isArray(response.data) ? response.data : [];
}
