/**
 * Interactions API Service
 * Type-safe client for interaction CRUD — module-wise, scoped to contacts/leads.
 */

import { apiClient } from '@/lib/api/client';

// ============================================================================
// Types
// ============================================================================

export type InteractionType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'NOTE'
  | 'SMS'
  | 'WHATSAPP'
  | 'VIDEO_CALL';

export type InteractionDirection = 'INBOUND' | 'OUTBOUND';

export interface Interaction {
  id: string;
  type: InteractionType;
  direction: InteractionDirection;
  summary: string;
  notes?: string | null;
  date: string;
  contactId?: string | null;
  leadId?: string | null;
  agentId: string;
  tenantId: string;
  agencyId: string;
  createdAt: string;
  createdBy?: string | null;
  agent?: { id: string; name: string; email: string };
  contact?: { id: string; name: string; phone: string } | null;
}

export interface CreateInteractionDto {
  type: InteractionType;
  direction: InteractionDirection;
  summary: string;
  notes?: string;
  date: string;
  contactId?: string;
  leadId?: string;
  tenantId: string;
  agencyId: string;
}

export interface UpdateInteractionDto {
  type?: InteractionType;
  direction?: InteractionDirection;
  summary?: string;
  notes?: string;
  date?: string;
}

export interface QueryInteractionsDto {
  type?: InteractionType;
  direction?: InteractionDirection;
  contactId?: string;
  leadId?: string;
  agentId?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface InteractionsListResponse {
  data: Interaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ContactInteractionSummary {
  total: number;
  byType: Record<string, number>;
  lastInteractionDate: string | null;
}

// ============================================================================
// Service
// ============================================================================

class InteractionsService {
  private readonly baseUrl = '/interactions';

  async create(dto: CreateInteractionDto): Promise<Interaction> {
    const response = await apiClient.post<Interaction>(this.baseUrl, dto);
    return response.data;
  }

  async findAll(
    query: QueryInteractionsDto = {},
  ): Promise<InteractionsListResponse> {
    const response = await apiClient.get<InteractionsListResponse>(
      this.baseUrl,
      { params: query },
    );
    return response.data;
  }

  async findOne(id: string): Promise<Interaction> {
    const response = await apiClient.get<Interaction>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async update(id: string, dto: UpdateInteractionDto): Promise<Interaction> {
    const response = await apiClient.put<Interaction>(
      `${this.baseUrl}/${id}`,
      dto,
    );
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getContactSummary(
    contactId: string,
  ): Promise<ContactInteractionSummary> {
    const response = await apiClient.get<ContactInteractionSummary>(
      `${this.baseUrl}/contact/${contactId}/summary`,
    );
    return response.data;
  }
}

export const interactionsService = new InteractionsService();
export default interactionsService;
