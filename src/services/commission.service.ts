/**
 * Commission Service – Data fetching & API for commission agents.
 * Uses auth store for internal agents, contacts API for external brokers.
 * When backend adds PATCH /deals/:id, add updateDealCommission here.
 */

import { getAllAgents } from '@/lib/auth';
import { contactsService } from './contacts.service';

export interface AgentOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

class CommissionService {
  /**
   * Internal agents (users) from auth store.
   * Sync – no API call; populated by app on load.
   */
  getInternalAgents(): AgentOption[] {
    const agents = getAllAgents();
    return agents.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email ?? undefined,
      phone: a.phone ?? undefined,
    }));
  }

  /**
   * External brokers (contacts). Fetches from API.
   * Backend may filter by category when EXTERNAL_BROKER is supported.
   */
  async getExternalBrokers(): Promise<AgentOption[]> {
    try {
      const res = await contactsService.findAll({ limit: 500 });
      const list = res?.data ?? [];
      return list.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email ?? undefined,
        phone: c.phone ?? undefined,
      }));
    } catch {
      return [];
    }
  }

  /** When backend supports PATCH /deals/:id, implement here. */
  // async updateDealCommission(dealId: string, payload: Partial<Deal>): Promise<Deal> { ... }
}

export const commissionService = new CommissionService();
